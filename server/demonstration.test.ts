import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {InquiryService,MODEL,type InquiryState} from './inquiry.js';
import {CommerceService,type CommerceState} from './commerce.js';
import {Gemini} from './gemini.js';
import type {Inquiry,InquiryInput} from '../shared/inquiry.js';
import {demoMerchants,merchantForInquiry,matchesMerchant} from '../shared/merchants.js';
import {TravelerHome} from '../src/TravelerHome.js';

const input={message:'Two vegetarian kotas, no chilli, for collection before departure.',travelerLanguage:'English',budget:'20.00',currency:'USD',departure:'2099-11-12T16:00:00+02:00'};
const offer={description:'Two vegetarian kotas, no chilli, as agreed with traveler',amount:'12.00',currency:'USD',readyAt:'2099-11-11T12:00:00+02:00',pickupLocation:'Fictional Kota Counter collection point',collectionTerms:'Collect locally; confirm ingredients directly with merchant.',clarification:'Two portions and ingredients confirmed with traveler.',approved:true};
function interpretation(i:InquiryInput){return {item:i.merchantId==='food'?'Kotas':'Bracelet',preferences:i.merchantId==='food'?['Quantity: two','Vegetarian','No chilli']:[],budgetConstraint:`${i.currency} ${i.budget} maximum`,deadlineConstraint:i.departure,constraints:['Local collection'],translatedRequest:i.message,travelerSummary:i.message,missingDetails:[],uncertainties:[]};}
function fixture(transform:(data:any)=>any=x=>x){
  let state:InquiryState={inquiries:[],usage:{day:'',count:0,lastAt:0}};let records:CommerceState={purchases:{}};let clock=Date.now();let aiCalls=0;let captures=0;
  const requests:any[]=[];const remote=new Map<string,any>();
  const service=new InquiryService({get:()=>state,save:s=>{state=structuredClone(s);}},{configured:()=>true,generate:async i=>{aiCalls++;return interpretation(i);}},()=>clock);
  const store={get:()=>records,save:(s:CommerceState)=>{records=structuredClone(s);}};
  const gateway={create:async(body:any)=>{const id=`DEMOORDER${requests.length+1}`;requests.push(body);remote.set(id,body);return {id};},capture:async(id:string)=>{captures++;const unit=remote.get(id).purchase_units[0];return transform({id,status:'COMPLETED',purchase_units:[{...unit,payments:{captures:[{id:`CAP${id}`,status:'COMPLETED',amount:unit.amount}]}}]});}};
  const restart=()=>new CommerceService(store,id=>service.view().inquiries.find(i=>i.id===id),gateway,()=>['LEGACYPAID']);
  const commerce=restart();
  async function submit(merchantId:'craft'|'food'='food'){clock+=6000;return service.submit({...input,merchantId,budget:merchantId==='craft'?'40.00':input.budget,message:merchantId==='food'?input.message:'A handmade bracelet'});}
  async function accepted(merchantId:'craft'|'food'='food'){
    const i=await submit(merchantId);service.review(i.id,'accept',null);
    service.approve(i.id,{...offer,description:merchantId==='food'?offer.description:'Handmade bracelet',amount:merchantId==='food'?'12.00':'35.00'});
    service.acceptOffer(i.id,1,true);return service.view().inquiries.find(x=>x.id===i.id)!;
  }
  return {service,commerce,restart,submit,accepted,requests,records:()=>records,calls:()=>({ai:aiCalls,captures}),mutate:(id:string,change:(i:Inquiry)=>void)=>change(state.inquiries.find(i=>i.id===id)!)};
}

test('only seeded merchant selection reaches AI; profiles share the daily cap and grounded prompt',async()=>{
  const x=fixture();await assert.rejects(x.service.submit({...input,merchantId:'invented',merchant:'Untrusted seller'}));assert.equal(x.calls().ai,0);
  for(let n=0;n<20;n++){
    const i=await x.submit(n%2?'craft':'food');assert.equal(i.merchantId,n%2?'craft':'food');assert.equal(i.merchant,merchantForInquiry(i)!.storedName);assert.equal(i.offer,undefined);
  }
  await assert.rejects(x.submit(),/Daily limit/);assert.equal(x.calls().ai,20);
  let wireCalls=0;
  const ai=new Gemini({AI_ENABLED:'true',AI_FREE_TIER_CONFIRMED:'true',AI_PROVIDER:'gemini',AI_MODEL:MODEL,AI_API_KEY:'dummy-test-only'},(async(_url,options)=>{
    wireCalls++;const body=JSON.parse(String(options?.body));const prompt=body.systemInstruction.parts[0].text;
    assert.match(prompt,/Chloro Kota Counter/);assert.match(prompt,/Never set or approve a final price/);assert.match(prompt,/quantity/);
    const sent=JSON.parse(body.contents[0].parts[0].text);assert.equal(sent.merchantId,'food');
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(interpretation(sent))}]}}]});
  }) as typeof fetch);
  assert.deepEqual((await ai.generate({...input,merchantId:'food'})).preferences,['Quantity: two','Vegetarian','No chilli']);assert.equal(wireCalls,1);
});

test('food price, quantity and readiness remain human-approved; no payment before exact acceptance',async()=>{
  const x=fixture();const i=await x.submit();assert.equal(i.offer,undefined);assert.deepEqual(i.interpretation?.preferences,['Quantity: two','Vegetarian','No chilli']);
  assert.throws(()=>x.service.approve(i.id,offer));x.service.review(i.id,'accept',null);
  for(const bad of [{approved:false},{amount:'21.00'},{currency:'ZAR'},{readyAt:'2100-01-01T00:00:00Z'}])assert.throws(()=>x.service.approve(i.id,{...offer,...bad}));
  const approved=x.service.approve(i.id,offer);assert.equal(approved.offer?.description,offer.description);assert.equal(approved.offer?.readyAt,new Date(offer.readyAt).toISOString());assert.equal(approved.offer?.amount,'12.00');
  await assert.rejects(x.commerce.create(i.id,1));assert.throws(()=>x.service.acceptOffer(i.id,2,true));assert.throws(()=>x.service.acceptOffer(i.id,1,false));
  x.service.acceptOffer(i.id,1,true);assert.throws(()=>x.service.approve(i.id,{...offer,amount:'15.00'}));assert.equal(x.requests.length,0);
});

test('food and legacy craft orders remain distinct, canonical, idempotent and linked through restart',async()=>{
  const x=fixture();const craft=await x.accepted('craft');
  // Original stored schema: no migration changes historical fingerprints.
  x.mutate(craft.id,i=>{delete i.merchantId;delete i.input.merchantId;});
  const old=await x.commerce.create(craft.id,1);await x.commerce.capture(craft.id,old.orderId!);const preserved=structuredClone(x.records().purchases[craft.id]);
  const food=await x.accepted();const next=await x.commerce.create(food.id,1);assert.notEqual(next.orderId,old.orderId);
  const unit=x.requests[1].purchase_units[0];assert.deepEqual(unit.amount,{currency_code:'USD',value:'12.00'});assert.equal(unit.description,offer.description);
  assert.equal(unit.reference_id,`inquiry-${food.id}`);assert.equal(unit.custom_id,`inquiry-${food.id}:v1`);
  for(const wrong of [old.orderId!,'LEGACYPAID'])await assert.rejects(x.commerce.capture(food.id,wrong));assert.equal(x.calls().captures,1);
  assert.equal((await x.commerce.capture(food.id,next.orderId!)).status,'PAID');assert.equal((await x.restart().capture(food.id,next.orderId!)).status,'PAID');assert.equal(x.calls().captures,2);
  assert.equal(x.commerce.collect(food.id,'ready').collection,'READY');assert.deepEqual(x.records().purchases[craft.id],preserved);assert.equal(x.calls().ai,2);
});

test('changed food merchant/terms and pending captures fail closed without duplicate capture',async()=>{
  for(const change of [
    (i:Inquiry)=>{i.merchantId='craft';},(i:Inquiry)=>{i.merchant='Invented seller';},
    (i:Inquiry)=>{i.merchantId='craft';i.merchant=demoMerchants[0].storedName;},
    (i:Inquiry)=>{i.offer!.amount='0.01';},(i:Inquiry)=>{i.offer!.readyAt='2099-11-11T11:00:00Z';}
  ]){
    const x=fixture();const i=await x.accepted();const o=await x.commerce.create(i.id,1);x.mutate(i.id,change);
    await assert.rejects(x.commerce.capture(i.id,o.orderId!));assert.equal(x.calls().captures,0);
  }
  const x=fixture(d=>{d.purchase_units[0].payments.captures[0].status='PENDING';return d;});const i=await x.accepted();const o=await x.commerce.create(i.id,1);
  await assert.rejects(x.commerce.capture(i.id,o.orderId!));assert.equal(x.commerce.status(i.id).status,'REVIEW_REQUIRED');assert.throws(()=>x.commerce.collect(i.id,'ready'));
  await assert.rejects(x.restart().capture(i.id,o.orderId!));assert.equal(x.calls().captures,1);
});

test('category and saved-merchant UI identifies both fictional profiles without invented offerings',()=>{
  const noop=()=>{};
  const props={message:'',destination:'',setMessage:noop,setDestination:noop,begin:noop,category:'food' as const,setCategory:noop,saved:[],savedOnly:false,openMerchant:noop,openSaved:noop};
  const food=renderToStaticMarkup(createElement(TravelerHome,props));assert.match(food,/Chloro Kota Counter/);assert.doesNotMatch(food,/Chloro Craft Studio|No participating demonstration food merchant/);
  const saved=renderToStaticMarkup(createElement(TravelerHome,{...props,saved:[...demoMerchants],savedOnly:true}));assert.match(saved,/Chloro Craft Studio/);assert.match(saved,/Chloro Kota Counter/);
  assert.equal(matchesMerchant(demoMerchants[1],'Two kotas'),true);assert.equal(matchesMerchant(demoMerchants[1],'Bracelet'),false);assert.equal(matchesMerchant(demoMerchants[0],'Cooking lesson'),false);
});
