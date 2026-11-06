import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtempSync,readFileSync,rmSync,rmdirSync,writeFileSync} from 'node:fs';
import type {AddressInfo} from 'node:net';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import express from 'express';
import {CommerceService, type CommerceState} from './commerce.js';
import {Gemini} from './gemini.js';
import {InquiryService, MODEL, recoverInterruptedInquiries, type InquiryState} from './inquiry.js';
import {inquiryRouter} from './inquiry-routes.js';
import {PaymentError} from './payment.js';

const now = Date.parse('2026-11-05T10:00:00Z');
const inquiry = {
  message: 'I need a local pickup before departure.',
  travelerLanguage: 'English',
  budget: '40.00',
  currency: 'USD',
  departure: '2099-11-12T16:00:00+02:00'
};
const interpretation = {
  item: 'Bracelet', preferences: [], budgetConstraint: null, deadlineConstraint: null,
  constraints: [], translatedRequest: 'Mock translation', travelerSummary: 'Pickup before departure.',
  missingDetails: [], uncertainties: []
};
const offer = {
  approved: true, description: 'Confirmed item and quantity', amount: '12.00',
  currency: 'USD', pickupLocation: 'Demo counter', readyAt: '2099-11-12T12:00:00+02:00',
  collectionTerms: 'Local pickup', clarification: ''
};
const cases = [
  {id:'food',language:'isiZulu',message:'Two vegetarian kotas, please.',
    translated:'Ngicela amakota amabili angenanyama.',reply:'Ngingawalungisa. Ngicela uqinisekise isikhathi.',
    english:'I can prepare them. Please confirm the time.',item:'Kotas'},
  {id:'craft',language:'Spanish',message:'A blue bracelet, please.',
    translated:'Una pulsera azul, por favor.',reply:'Puedo prepararla. Confirme el tamaño, por favor.',
    english:'I can prepare it. Please confirm the size.',item:'Bracelet'}
] as const;
function wire(payload: unknown) {
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(payload)}]}}]});
}
function fixture(request: typeof fetch, count = 0) {
  let clock = now;
  let state: InquiryState = {inquiries:[],usage:{day:'2026-11-05',count,lastAt:0}};
  const store = {get:()=>state,save:(next:InquiryState)=>{state=structuredClone(next);}};
  const ai = new Gemini({
    AI_ENABLED:'true',AI_FREE_TIER_CONFIRMED:'true',AI_PROVIDER:'gemini',
    AI_MODEL:MODEL,AI_API_KEY:'dummy-test-only'
  },request);
  return {
    service: new InquiryService(store,ai,()=>clock),
    advance:()=>{clock+=6000;},
    stored:()=>structuredClone(state)
  };
}

for (const example of cases) {
  test(`English and ${example.language} use the profile language and preserve the approved offer`, async () => {
    const originalReply = `${example.reply}\n`;
    let calls = 0;
    const x = fixture(async (url,options) => {
      calls++;
      assert.match(String(url),new RegExp(`/${MODEL}:generateContent$`));
      const body = JSON.parse(String(options?.body));
      const prompt = body.systemInstruction.parts[0].text;
      const sent = JSON.parse(body.contents[0].parts[0].text);
      if (calls === 1) {
        assert.match(prompt,new RegExp(`into ${example.language} in translatedRequest`));
        assert.match(prompt,new RegExp(`in ${example.language} for merchant review`));
        assert.equal(sent.message,example.message);
        return wire({...interpretation,item:example.item,translatedRequest:example.translated});
      }
      assert.equal(calls,2);
      assert.match(prompt,new RegExp(`${example.language} reply into English`));
      assert.deepEqual(sent,{original:originalReply});
      assert.deepEqual(body.generationConfig.responseJsonSchema.required,['translatedReply','uncertainties']);
      assert.equal(x.stored().usage.count,20);
      assert.equal(x.stored().inquiries[0].merchantReply?.status,'TRANSLATING');
      return wire({translatedReply:`${example.english} I mentioned USD 1.00 in this message.`,uncertainties:[]});
    },18);
    const i = await x.service.submit({...inquiry,merchantId:example.id,message:example.message,merchantLanguage:'French'});
    assert.equal(i.merchantLanguage,example.language);
    assert.equal(i.input.message,example.message);
    assert.equal(i.interpretation?.translatedRequest,example.translated);
    assert.equal(i.offer,undefined);
    x.service.review(i.id,'accept',null);
    const approved = x.service.approve(i.id,offer).offer;
    await assert.rejects(x.service.translateMerchantReply(i.id,{message:originalReply}),/Wait five seconds/);
    x.advance();
    const replied = await x.service.translateMerchantReply(i.id,{message:originalReply,merchantLanguage:'French',amount:'0.01',approved:false});
    assert.deepEqual(replied.merchantReply,{
      original:originalReply,status:'TRANSLATED',
      translation:{translatedReply:`${example.english} I mentioned USD 1.00 in this message.`,uncertainties:[]}
    });
    assert.deepEqual(replied.offer,approved);
    assert.equal(replied.status,'OFFER_APPROVED');
    assert.deepEqual(x.stored().inquiries[0].merchantReply,replied.merchantReply);
    await assert.rejects(x.service.translateMerchantReply(i.id,{message:originalReply}),/already translated/);
    x.advance();
    await assert.rejects(x.service.submit(inquiry),/Daily limit/);
    assert.equal(calls,2);

    let commerceState: CommerceState = {purchases:{}};
    let order: unknown;
    const commerce = new CommerceService({get:()=>commerceState,save:next=>{commerceState=next;}},
      id=>x.service.view().inquiries.find(entry=>entry.id===id),{
        create:async body=>{order=body;return {id:'MOCKORDER'};},
        capture:async()=>{throw new Error('Capture is outside this test.');}
      });
    await assert.rejects(commerce.create(i.id,1),/traveler acceptance/);
    x.service.acceptOffer(i.id,1,true);
    await commerce.create(i.id,1);
    assert.deepEqual((order as {purchase_units: {amount: unknown}[]}).purchase_units[0].amount,
      {currency_code:'USD',value:'12.00'});
  });
}

test('invalid reply preserves the original and pauses the shared AI allowance', async () => {
  let calls = 0;
  const x = fixture(async () => wire(++calls === 1 ? interpretation :
    {translatedReply:'Invalid result',uncertainties:[],amount:'0.01',approved:true}));
  const i = await x.service.submit(inquiry);
  await assert.rejects(x.service.translateMerchantReply(i.id,{message:'Hola'}),/Review the inquiry/);
  x.service.review(i.id,'accept',null);
  x.advance();
  const pending = x.service.translateMerchantReply(i.id,{message:'Hola'});
  const snapshot = x.stored();
  assert.equal(snapshot.inquiries[0].merchantReply?.status,'TRANSLATING');
  await assert.rejects(x.service.translateMerchantReply(i.id,{message:'Hola'}),/already .*being translated/);
  const recovered = recoverInterruptedInquiries(snapshot)!;
  assert.equal(recovered.inquiries[0].merchantReply?.status,'ERROR');
  assert.equal(recovered.inquiries[0].merchantReply?.original,'Hola');
  assert.deepEqual(recovered.usage,snapshot.usage);
  const result = await pending;
  assert.equal(result.merchantReply?.status,'ERROR');
  assert.equal(result.merchantReply?.original,'Hola');
  assert.equal(result.offer,undefined);
  assert.equal(result.status,'MERCHANT_REVIEW');
  x.advance();
  await assert.rejects(x.service.submit(inquiry),/paused/);
  assert.equal(calls,2);
});

test('reply endpoint writes to the existing inquiry store and preserves legacy records', async () => {
  const folder = mkdtempSync(join(tmpdir(),'chloro-translation-'));
  const file = join(folder,'inquiries.json');
  const x = fixture(async () => wire(interpretation));
  const current = await x.service.submit(inquiry);
  x.service.review(current.id,'accept',null);
  const saved = x.stored();
  const legacy = {...saved.inquiries[0],id:'legacy',merchantLanguage:'English'};
  saved.inquiries.push(legacy);
  saved.usage.lastAt = 0;
  writeFileSync(file,JSON.stringify(saved));
  let translations = 0;
  const app = express();
  app.use(express.json());
  app.use('/api/inquiries',inquiryRouter({
    create:async()=>{throw new Error('Unexpected payment creation');},
    capture:async()=>{throw new Error('Unexpected payment capture');}
  },()=>[],{
    dataDir:folder,
    ai:{
      configured:()=>true,
      generate:async()=>{throw new Error('Unexpected inquiry translation');},
      translateReply:async()=>{translations++;return {translatedReply:'Please confirm the size.',uncertainties:['Size unspecified']};}
    }
  }));
  app.use((err:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
    res.status(err instanceof PaymentError ? err.code : 500).end();
  });
  const server = app.listen(0,'127.0.0.1');
  try {
    await once(server,'listening');
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/inquiries`;
    const original = 'Confirme el tamaño, por favor.';
    const sendReply = (id:string) => fetch(`${base}/${id}/reply`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:original})
    });
    assert.equal((await sendReply('legacy')).status,422);
    assert.equal(translations,0);
    assert.equal((await sendReply(current.id)).status,200);
    const response = await fetch(base);
    const view = await response.json();
    assert.deepEqual(view.inquiries[0].merchantReply,{
      status:'TRANSLATED',original,translation:{translatedReply:'Please confirm the size.',uncertainties:['Size unspecified']}
    });
    assert.deepEqual(view.inquiries[1],legacy);
    assert.deepEqual(JSON.parse(readFileSync(file,'utf8')).inquiries,view.inquiries);
    assert.equal(translations,1);
  } finally {
    await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    rmSync(file,{force:true});
    rmdirSync(folder);
  }
});
