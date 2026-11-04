import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {InquiryService,validateInterpretation,parseGeminiResponse,MODEL,type InquiryState} from './inquiry.js';
import {Gemini} from './gemini.js';

const now=Date.parse('2026-11-04T10:00:00Z');
const input={message:'Quiero una pulsera azul sin níquel.',travelerLanguage:'Spanish',budget:'40.00',currency:'USD',departure:'2026-11-11T16:00:00+02:00'};
// Explicit mocked interpretation; never used by the running application.
const output={item:'Bracelet',preferences:['Blue','Nickel-free'],budgetConstraint:'USD 40.00 maximum',deadlineConstraint:'2026-11-11T16:00:00+02:00',
  constraints:['Local collection before departure'],translatedRequest:'I want a blue nickel-free bracelet.',travelerSummary:'Quieres una pulsera azul sin níquel.',missingDetails:[],uncertainties:[]};
function setup(generate:()=>Promise<unknown>=async()=>output,configured=true){
  let state:InquiryState={inquiries:[],usage:{day:'',count:0,lastAt:0}};let clock=now;let calls=0;
  const store={get:()=>structuredClone(state),save:(s:InquiryState)=>{state=structuredClone(s);}};
  const ai={configured:()=>configured,generate:async()=>{calls++;return generate();}};
  return {service:new InquiryService(store,ai,()=>clock),restart:()=>new InquiryService(store,ai,()=>clock),tick:(ms=6000)=>{clock+=ms;},calls:()=>calls};
}
const offer={description:'Handmade blue nickel-free bracelet, 17 cm',amount:'35.00',currency:'USD',readyAt:'2026-11-11T12:00:00+02:00',
  pickupLocation:'Fictional demo counter',collectionTerms:'Collect locally before departure',clarification:'Traveler confirmed 17 cm size.',approved:true};
test('valid structured Gemini response preserves extracted facts and translation',async()=>{
  const wire={candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(output)}]}}]};
  assert.deepEqual(parseGeminiResponse(wire),output);
  const x=setup();const i=await x.service.submit(input);assert.equal(i.status,'AWAITING_MERCHANT');assert.equal(i.input.message,input.message);assert.equal(i.offer,undefined);
  const uncertain=setup(async()=>({...output,item:null,missingDetails:['Which item?']}));assert.equal((await uncertain.service.submit(input)).status,'NEEDS_CLARIFICATION');
});
test('invalid/missing/truncated AI data fails honestly; unavailable AI never fabricates an interpretation',async()=>{
  for(const data of [{}, {candidates:[]},{candidates:[{finishReason:'MAX_TOKENS'}]}, {candidates:[{finishReason:'STOP',content:{parts:[{text:'invalid JSON'}]}}]}])assert.throws(()=>parseGeminiResponse(data));
  assert.throws(()=>validateInterpretation({...output,finalPrice:'35.00'}));assert.throws(()=>validateInterpretation({...output,preferences:'blue'}));
  const x=setup(async()=>({item:'Bracelet'}));const i=await x.service.submit(input);assert.equal(i.status,'AI_ERROR');assert.equal(i.interpretation,undefined);
  x.tick();await assert.rejects(x.service.submit(input));assert.equal(x.calls(),1);
  const disabled=setup(undefined,false);await assert.rejects(disabled.service.submit(input));assert.equal(disabled.calls(),0);
});
test('only merchant enters/approves exact price/time; buyer explicitly accepts version; decline works',async()=>{
  const x=setup();const i=await x.service.submit(input);
  assert.throws(()=>x.service.approve(i.id,offer));x.service.review(i.id,'accept',null);
  assert.throws(()=>x.service.approve(i.id,{...offer,approved:false}));assert.throws(()=>x.service.approve(i.id,{...offer,amount:'41.00'}));
  assert.throws(()=>x.service.approve(i.id,{...offer,readyAt:'2026-11-12T12:00:00Z'}));
  const approved=x.service.approve(i.id,offer);assert.equal(approved.offer?.amount,'35.00');assert.equal(approved.offer?.merchantApproved,true);
  assert.throws(()=>x.service.acceptOffer(i.id,2,true));assert.throws(()=>x.service.acceptOffer(i.id,1,false));
  assert.equal(x.service.acceptOffer(i.id,1,true).status,'BUYER_ACCEPTED');assert.throws(()=>x.service.approve(i.id,{...offer,amount:'36.00'}));
  x.tick();const other=await x.service.submit(input);assert.equal(x.service.review(other.id,'decline','Cannot meet deadline').status,'DECLINED');
  const uncertain=setup(async()=>({...output,missingDetails:['Bracelet size?']}));const needs=await uncertain.service.submit(input);uncertain.service.review(needs.id,'accept',null);
  assert.throws(()=>uncertain.service.approve(needs.id,{...offer,clarification:''}));
});
test('20/day cap persists across service restarts; invalid inputs, concurrency, quota/network failures stop safely',async()=>{
  const x=setup();await assert.rejects(x.service.submit({...input,message:'x'.repeat(2001)}));await assert.rejects(x.service.submit({...input,departure:'2020-01-01T12:00:00Z'}));assert.equal(x.calls(),0);
  for(let n=0;n<20;n++){await x.service.submit(input);x.tick();}
  await assert.rejects(x.restart().submit(input),/Daily limit/);assert.equal(x.calls(),20);
  x.tick(86400000);await x.restart().submit(input);assert.equal(x.calls(),21);
  const fail=setup(async()=>{throw new Error('429 or network failure');});await fail.service.submit(input);fail.tick();await assert.rejects(fail.restart().submit(input));assert.equal(fail.calls(),1);
  let finish!:(v:unknown)=>void;const slow=setup(()=>new Promise(resolve=>{finish=resolve;}));const pending=slow.service.submit(input);
  await assert.rejects(slow.service.submit(input));finish(output);await pending;assert.equal(slow.calls(),1);
});
test('Gemini uses allowlisted free model/JSON schema and never retries provider quota errors',async()=>{
  let calls=0;const env={AI_ENABLED:'true',AI_FREE_TIER_CONFIRMED:'true',AI_PROVIDER:'gemini',AI_MODEL:MODEL,AI_API_KEY:'dummy-test-only'};
  const gateway=new Gemini(env,(async(url,options)=>{calls++;assert.match(String(url),/gemini-3\.5-flash-lite:generateContent$/);
    const body=JSON.parse(String(options?.body));assert.equal(body.generationConfig.responseMimeType,'application/json');assert.equal(body.tools,undefined);
    return new Response('{}',{status:429});}) as typeof fetch);
  await assert.rejects(gateway.generate(input));assert.equal(calls,1);assert.equal(new Gemini({...env,AI_FREE_TIER_CONFIRMED:'false'}).configured(),false);
  assert.equal(new Gemini({...env,AI_MODEL:'paid-model'}).configured(),false);
});
test('M2 approval/acceptance cannot change M1 paid record or call PayPal',async()=>{
  const file='local-data/purchase.json';const before=existsSync(file)?readFileSync(file):undefined;
  const x=setup();const i=await x.service.submit(input);x.service.review(i.id,'accept',null);x.service.approve(i.id,offer);x.service.acceptOffer(i.id,1,true);
  assert.deepEqual(existsSync(file)?readFileSync(file):undefined,before);
  for(const file of ['server/inquiry.ts','server/gemini.ts','server/inquiry-routes.ts']){
    const source=readFileSync(file,'utf8');assert.doesNotMatch(source,/from ['"].*paypal|new PaymentService|\/api\/orders/);
  }
  if(before)assert.ok(createHash('sha256').update(before).digest('hex'));
});
