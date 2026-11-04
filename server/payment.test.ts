import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PaymentService, quote as seededQuote, fingerprint, type RecordState, type Quote} from './payment.js';
// Keep the legacy fixture's historical dates intact in production; tests use a future deadline.
const quote={...seededQuote,pickupBy:'2099-11-12T17:00:00+02:00'};
function setup(transform: (data: any) => any = x=>x) {
  let state: RecordState | undefined; let current = {...quote}; let creates = 0; let captures = 0; let sent: any;
  const service = new PaymentService({get: ()=>state, save: r=>{state={...r};}}, {
    create: async body => {creates++;sent=body;return {id:'ORDER123'};},
    capture: async () => {captures++;return transform({id:'ORDER123', status:'COMPLETED', purchase_units:[{reference_id:quote.id, custom_id:`${quote.id}:v1`,payments:{captures:[{id:'CAPTURE123',status:'COMPLETED',amount:{value:'35.00',currency_code:'USD'}}]}}]});}
  }, ()=>current);
  return {service, change:(q:Partial<Quote>)=>{current={...current,...q};}, counts:()=>({creates,captures}), body:()=>sent};
}
test('server creates only canonical USD 35.00 quote after explicit acceptance', async()=>{
  const x=setup(); await assert.rejects(x.service.create(fingerprint(quote),false));
  await x.service.create(fingerprint(quote),true);
  assert.deepEqual(x.body().purchase_units[0].amount,{currency_code:'USD',value:'35.00'});
  assert.equal(x.body().payment_source.paypal.experience_context.shipping_preference,'NO_SHIPPING');
});
test('altered, unapproved and changed quotes rejected before remote payment', async()=>{
  const x=setup(); await assert.rejects(x.service.create('altered',true));
  x.change({merchantApproved:false}); await assert.rejects(x.service.create(fingerprint(quote),true));
  assert.equal(x.counts().creates,0);
  x.change({merchantApproved:true}); await x.service.create(fingerprint(quote),true);
  x.change({amount:'36.00'}); await assert.rejects(x.service.capture('ORDER123')); assert.equal(x.counts().captures,0);
});
test('completed capture verifies association and duplicate/concurrent capture is prevented',async()=>{
  const x=setup(); await x.service.create(fingerprint(quote),true);
  await assert.rejects(x.service.capture('OTHER'));
  const results=await Promise.allSettled([x.service.capture('ORDER123'),x.service.capture('ORDER123')]);
  assert.equal(results[0].status,'fulfilled'); assert.equal(results[1].status,'rejected');
  assert.equal((await x.service.capture('ORDER123')).status,'PAID'); assert.equal(x.counts().captures,1);
});
test('pending, declined, wrong amount/currency/order/quote never become Paid; no second capture',async()=>{
  for(const mutate of [
    (d:any)=>{d.purchase_units[0].payments.captures[0].status='PENDING';return d;},
    (d:any)=>{d.purchase_units[0].payments.captures[0].status='DECLINED';return d;},
    (d:any)=>{d.purchase_units[0].payments.captures[0].amount.value='0.01';return d;},
    (d:any)=>{d.purchase_units[0].payments.captures[0].amount.currency_code='EUR';return d;},
    (d:any)=>{d.id='OTHER';return d;},
    (d:any)=>{d.purchase_units[0].custom_id='other';return d;},
    ()=>{throw new Error('network failure');}
  ]) {
    const x=setup(mutate); await x.service.create(fingerprint(quote),true);
    await assert.rejects(x.service.capture('ORDER123')); assert.equal(x.service.status().status,'REVIEW_REQUIRED');
    await assert.rejects(x.service.capture('ORDER123')); assert.equal(x.counts().captures,1);
  }
});
