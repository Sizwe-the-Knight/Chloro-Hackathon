import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CommerceService,type CommerceState} from './commerce.js';
import {InquiryService,type InquiryState} from './inquiry.js';
import type {Inquiry} from '../shared/inquiry.js';

const original={message:'A handmade bracelet',travelerLanguage:'English',budget:'50.00',currency:'USD',departure:'2099-11-12T16:00:00+02:00'};
const offer={approved:true,description:'Custom blue bracelet',amount:'27.50',currency:'USD',readyAt:'2099-11-11T12:00:00+02:00',pickupLocation:'Fictional demo counter',collectionTerms:'Local collection only.',clarification:''};
const interpreted={item:'Bracelet',preferences:[],budgetConstraint:'USD 50 maximum',deadlineConstraint:original.departure,constraints:[],translatedRequest:original.message,travelerSummary:original.message,missingDetails:[],uncertainties:[]};
function setup(transform:(data:any)=>any=x=>x){
  let inquiries:InquiryState={inquiries:[],usage:{day:'',count:0,lastAt:0}};let records:CommerceState={purchases:{}};let clock=Date.now();
  const requests:any[]=[];let captures=0;const keys:string[]=[];const remote=new Map<string,any>();
  const ai=new InquiryService({get:()=>inquiries,save:s=>{inquiries=s;}},{configured:()=>true,generate:async()=>interpreted},()=>clock);
  const store={get:()=>records,save:(s:CommerceState)=>{records=structuredClone(s);}};
  const gateway={create:async(body:unknown,key:string)=>{const id=`ORDER${requests.length+1}`;requests.push(body);keys.push(key);remote.set(id,body);return {id};},
    capture:async(id:string)=>{captures++;const unit=remote.get(id).purchase_units[0];return transform({id,status:'COMPLETED',purchase_units:[{...unit,payments:{captures:[{id:`CAP${id}`,status:'COMPLETED',amount:unit.amount}]}}]});}};
  const createService=()=>new CommerceService(store,id=>ai.view().inquiries.find(i=>i.id===id),gateway,()=>['M1PAIDORDER']);
  const commerce=createService();
  async function inquiry(accept=true):Promise<Inquiry>{clock+=6000;const i=await ai.submit(original);ai.review(i.id,'accept',null);ai.approve(i.id,offer);if(accept)ai.acceptOffer(i.id,1,true);return ai.view().inquiries.find(x=>x.id===i.id)!;}
  return {ai,commerce,inquiry,requests,keys,captures:()=>captures,restart:createService,records:()=>records,mutate:(id:string,change:(i:Inquiry)=>void)=>change(inquiries.inquiries.find(i=>i.id===id)!)};
}
test('accepted M2 offer drives a new server-owned amount/order and collection flow',async()=>{
  const x=setup();const i=await x.inquiry();const aiBefore=JSON.stringify(x.ai.view());
  assert.throws(()=>x.commerce.collect(i.id,'ready'));
  const order=await x.commerce.create(i.id,1);assert.equal(order.orderId,'ORDER1');
  const unit=x.requests[0].purchase_units[0];assert.deepEqual(unit.amount,{currency_code:'USD',value:'27.50'});
  assert.equal(unit.reference_id,`inquiry-${i.id}`);assert.equal(unit.custom_id,`inquiry-${i.id}:v1`);
  const paid=await x.commerce.capture(i.id,order.orderId!);assert.equal(paid.status,'PAID');assert.equal(paid.collection,'AWAITING_READY');
  assert.throws(()=>x.commerce.collect(i.id,'traveler-handover'));
  assert.equal(x.commerce.collect(i.id,'ready').collection,'READY');x.commerce.collect(i.id,'traveler-handover');
  assert.equal(x.commerce.collect(i.id,'merchant-handover').collection,'HANDOVER_RECORDED');
  assert.equal(JSON.stringify(x.ai.view()),aiBefore); // Checkout/collection cannot trigger AI or mutate approved terms.
});
test('unaccepted/unapproved/changed/expired offers and wrong order associations never capture',async()=>{
  const x=setup();const i=await x.inquiry(false);await assert.rejects(x.commerce.create(i.id,1));x.ai.acceptOffer(i.id,1,true);
  await assert.rejects(x.commerce.create(i.id,2));const order=await x.commerce.create(i.id,1);
  await assert.rejects(x.commerce.capture(i.id,'M1PAIDORDER'));assert.equal(x.captures(),0);
  for(const change of [
    (i:Inquiry)=>{i.offer!.amount='0.01';},(i:Inquiry)=>{i.offer!.currency='EUR';},
    (i:Inquiry)=>{i.offer!.pickupLocation='Changed counter';},(i:Inquiry)=>{i.offer!.clarification='Changed clarification';},
    (i:Inquiry)=>{i.offer!.merchantApproved=false as true;},(i:Inquiry)=>{i.acceptedVersion=2;},
    (i:Inquiry)=>{i.input.departure='2020-01-01T12:00:00Z';}
  ]){
    const y=setup();const accepted=await y.inquiry();const o=await y.commerce.create(accepted.id,1);y.mutate(accepted.id,change);
    await assert.rejects(y.commerce.capture(accepted.id,o.orderId!));assert.equal(y.captures(),0);
  }
  assert.equal(order.orderId,'ORDER1');
});
test('duplicate/concurrent captures stay idempotent across restart; other purchases get distinct orders',async()=>{
  const x=setup();const i=await x.inquiry();const o=await x.commerce.create(i.id,1);
  assert.deepEqual(await x.commerce.create(i.id,1),o);assert.equal(x.requests.length,1);
  const pair=await Promise.allSettled([x.commerce.capture(i.id,o.orderId!),x.commerce.capture(i.id,o.orderId!)]);
  assert.equal(pair[0].status,'fulfilled');assert.equal(pair[1].status,'rejected');
  assert.equal((await x.restart().capture(i.id,o.orderId!)).status,'PAID');assert.equal(x.captures(),1);
  await assert.rejects(x.commerce.create(i.id,1));const other=await x.inquiry();const next=await x.commerce.create(other.id,1);
  assert.notEqual(next.orderId,o.orderId);assert.notEqual(x.keys[0],x.keys[1]);
  await assert.rejects(x.commerce.capture(other.id,o.orderId!));assert.equal(x.captures(),1);
});
test('declined/pending/mismatched captures never unlock collection or another capture',async()=>{
  for(const alter of [
    (d:any)=>{d.purchase_units[0].payments.captures[0].status='PENDING';return d;},
    (d:any)=>{d.purchase_units[0].payments.captures[0].status='DECLINED';return d;},
    (d:any)=>{d.purchase_units[0].payments.captures[0].amount={currency_code:'USD',value:'35.00'};return d;},
    (d:any)=>{d.purchase_units[0].custom_id='another-offer:v1';return d;}
  ]){
    const x=setup(alter);const i=await x.inquiry();const o=await x.commerce.create(i.id,1);
    await assert.rejects(x.commerce.capture(i.id,o.orderId!));assert.equal(x.commerce.status(i.id).status,'REVIEW_REQUIRED');
    assert.throws(()=>x.commerce.collect(i.id,'ready'));await assert.rejects(x.restart().capture(i.id,o.orderId!));assert.equal(x.captures(),1);
  }
});
test('completed legacy order cannot be reused and original M1 payment file stays unchanged',async()=>{
  const file='local-data/purchase.json';const before=existsSync(file)?readFileSync(file):undefined;const x=setup();const i=await x.inquiry();
  let calls=0;const reserved=new CommerceService({get:()=>({purchases:{}}),save:()=>{}},()=>i,
    {create:async()=>{calls++;return {id:'M1PAIDORDER'};},capture:async()=>{throw new Error('Must not capture legacy order');}},()=>['M1PAIDORDER']);
  await assert.rejects(reserved.create(i.id,1),/already associated/);assert.equal(calls,1);
  const o=await x.commerce.create(i.id,1);await x.commerce.capture(i.id,o.orderId!);
  assert.deepEqual(existsSync(file)?readFileSync(file):undefined,before);
});
