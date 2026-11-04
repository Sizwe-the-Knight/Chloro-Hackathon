import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import type {AddressInfo} from 'node:net';
import {inquiryRouter} from './inquiry-routes.js';
import {PaymentError} from './payment.js';
import type {InquiryState,Interpreter} from './inquiry.js';

const input={message:'A blue bracelet',travelerLanguage:'English',budget:'40.00',currency:'USD',departure:'2099-11-12T16:00:00+02:00'};
const offer={description:'Blue bracelet',amount:'35.00',currency:'USD',readyAt:'2099-11-11T12:00:00+02:00',pickupLocation:'Fictional counter',collectionTerms:'Local collection only',clarification:'17 cm confirmed with traveler',approved:true};
const ambiguous={item:'Bracelet',preferences:['Blue'],budgetConstraint:'USD 40 maximum',deadlineConstraint:input.departure,constraints:[],translatedRequest:input.message,travelerSummary:input.message,missingDetails:['What size?'],uncertainties:['Confirm the required material.']};
function fixture(){
  mkdirSync('local-data',{recursive:true});const dir=mkdtempSync(resolve('local-data/m4-'));
  let calls=0;let captures=0;let captureStatus='COMPLETED';let aiCalls=0;
  const units=new Map<string,any>();
  const ai:Interpreter={configured:()=>true,generate:async()=>{aiCalls++;return ambiguous;}};
  const gateway={create:async(body:any)=>{const id=`MOCKORDER${++calls}`;units.set(id,body.purchase_units[0]);return {id};},capture:async(id:string)=>{captures++;return {id,status:'COMPLETED',purchase_units:[{...units.get(id),payments:{captures:[{id:`MOCKCAP${id}`,status:captureStatus,amount:units.get(id).amount}]}}]};}};
  async function boot(interpreter=ai){
    const app=express();app.use(express.json());app.use('/api/inquiries',inquiryRouter(gateway,()=>['LEGACYPAID'],{dataDir:dir,ai:interpreter}));
    app.use((e:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>res.status(e instanceof PaymentError?e.code:500).json({message:(e as Error).message}));
    const server=await new Promise<ReturnType<typeof app.listen>>(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/inquiries`;
    async function call(path='',body?:unknown){const r=await fetch(base+path,body===undefined?undefined:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
    const close=()=>new Promise<void>((resolve,reject)=>{server.close(e=>e?reject(e):resolve());server.closeIdleConnections();});
    return {call,close};
  }
  function cleanup(){if(!dir.startsWith(resolve('local-data')+sep+'m4-'))throw new Error('Unsafe test cleanup path');rmSync(dir,{recursive:true,force:true});}
  return {dir,boot,cleanup,counts:()=>({orders:calls,captures,ai:aiCalls}),captureStatus:(value:string)=>{captureStatus=value;}};
}
async function accepted(app:Awaited<ReturnType<ReturnType<typeof fixture>['boot']>>){
  const submission=await app.call('',input);assert.equal(submission.status,200);const id=submission.data.id;
  assert.equal(submission.data.status,'NEEDS_CLARIFICATION');
  await app.call(`/${id}/review`,{action:'accept'});
  assert.equal((await app.call(`/${id}/offer`,{...offer,clarification:''})).status,422);
  assert.equal((await app.call(`/${id}/offer`,{...offer,currency:'ZAR'})).status,422);
  assert.equal((await app.call(`/${id}/offer`,offer)).status,200);
  assert.equal((await app.call(`/${id}/accept`,{version:1,accepted:true})).status,200);
  return id as string;
}
test('ambiguous/missing AI output requires clarification or fails honestly; counts survive restart',async()=>{
  const f=fixture();let app=await f.boot();
  try{const i=await app.call('',input);assert.equal(i.data.status,'NEEDS_CLARIFICATION');assert.equal(i.data.offer,undefined);
    await app.close();app=await f.boot();const reloaded=await app.call();assert.equal(reloaded.data.ai.used,1);assert.equal(reloaded.data.inquiries[0].status,'NEEDS_CLARIFICATION');assert.equal(f.counts().ai,1);
  }finally{await app.close();f.cleanup();}
  const missing=fixture();const bad=await missing.boot({configured:()=>true,generate:async()=>undefined});
  try{const i=await bad.call('',input);assert.equal(i.data.status,'AI_ERROR');assert.equal(i.data.interpretation,undefined);assert.match(i.data.error,/No interpretation/);
    assert.equal((await bad.call('',input)).status,503);
  }finally{await bad.close();missing.cleanup();}
});
test('pending/declined captures stay unpaid and blocked across real file-store restart',async()=>{
  for(const status of ['PENDING','DECLINED']){
    const f=fixture();f.captureStatus(status);let app=await f.boot();
    try{const id=await accepted(app);const order=await app.call(`/${id}/payment/orders`,{version:1});
      assert.equal((await app.call(`/${id}/payment/orders/${order.data.orderId}/capture`,{})).status,422);
      await app.close();app=await f.boot();const payment=await app.call(`/${id}/payment`);assert.equal(payment.data.status,'REVIEW_REQUIRED');assert.equal(payment.data.collection,'NOT_PAID');
      assert.equal((await app.call(`/${id}/collection`,{action:'ready'})).status,409);
      assert.equal((await app.call(`/${id}/payment/orders/${order.data.orderId}/capture`,{})).status,409);assert.equal(f.counts().captures,1);
    }finally{await app.close();f.cleanup();}
  }
});
test('duplicate capture is idempotent after restart; new judge inquiry keeps previous paid purchase',async()=>{
  const f=fixture();let app=await f.boot();
  try{const id=await accepted(app);const o=await app.call(`/${id}/payment/orders`,{version:1});const path=`/${id}/payment/orders/${o.data.orderId}/capture`;
    const results=await Promise.all([app.call(path,{}),app.call(path,{})]);assert.ok(results.some(r=>r.status===200));assert.equal(f.counts().captures,1);
    const commerceBefore=readFileSync(resolve(f.dir,'commerce.json'));
    await app.close();app=await f.boot();assert.equal((await app.call(path,{})).data.status,'PAID');assert.equal(f.counts().captures,1);
    assert.deepEqual(readFileSync(resolve(f.dir,'commerce.json')),commerceBefore);
    // Advance only the fixture's spacing timestamp, never the real application counter.
    await app.close();const stored:InquiryState=JSON.parse(readFileSync(resolve(f.dir,'inquiries.json'),'utf8'));stored.usage.lastAt=0;writeFileSync(resolve(f.dir,'inquiries.json'),JSON.stringify(stored));app=await f.boot();
    const next=await accepted(app);assert.notEqual(next,id);assert.equal((await app.call(`/${next}/payment`)).data.status,'UNPAID');assert.equal((await app.call(`/${id}/payment`)).data.status,'PAID');
    assert.deepEqual(readFileSync(resolve(f.dir,'commerce.json')),commerceBefore);assert.equal((await app.call()).data.ai.used,2);
  }finally{await app.close();f.cleanup();}
});
test('changed quote and interrupted capture never send a second capture after restart',async()=>{
  for(const change of ['quote','capture']){
    const f=fixture();let app=await f.boot();
    try{const id=await accepted(app);const o=await app.call(`/${id}/payment/orders`,{version:1});await app.close();
      if(change==='quote'){const s=JSON.parse(readFileSync(resolve(f.dir,'inquiries.json'),'utf8'));s.inquiries[0].offer.amount='0.01';writeFileSync(resolve(f.dir,'inquiries.json'),JSON.stringify(s));}
      else{const s=JSON.parse(readFileSync(resolve(f.dir,'commerce.json'),'utf8'));s.purchases[id].payment.status='CAPTURING';writeFileSync(resolve(f.dir,'commerce.json'),JSON.stringify(s));}
      app=await f.boot();assert.equal((await app.call(`/${id}/payment/orders/${o.data.orderId}/capture`,{})).status,409);assert.equal(f.counts().captures,0);
    }finally{await app.close();f.cleanup();}
  }
});
test('interrupted inference becomes an honest error without retry/reset; corrupt storage fails closed',async()=>{
  const f=fixture();const day=new Date(Date.now()+7200000).toISOString().slice(0,10);
  const state={inquiries:[{id:'INTERRUPTED',createdAt:new Date().toISOString(),input,merchant:'Demo',merchantLanguage:'English',status:'INTERPRETING'}],usage:{day,count:7,lastAt:Date.now()}};
  writeFileSync(resolve(f.dir,'inquiries.json'),JSON.stringify(state));const app=await f.boot();
  try{const reloaded=await app.call();assert.equal(reloaded.data.inquiries[0].status,'AI_ERROR');assert.match(reloaded.data.inquiries[0].error,/server stopped/);assert.equal(reloaded.data.ai.used,7);assert.equal(f.counts().ai,0);
  }finally{await app.close();}
  try{const corrupt='{broken JSON';writeFileSync(resolve(f.dir,'inquiries.json'),corrupt);await assert.rejects(f.boot());assert.equal(readFileSync(resolve(f.dir,'inquiries.json'),'utf8'),corrupt);}finally{f.cleanup();}
});
