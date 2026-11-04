import {useEffect,useRef,useState} from 'react';
import type {Inquiry} from '../shared/inquiry.js';
import type {PaymentView} from '../shared/commerce.js';
import {loadSDK} from './paypal-sdk.js';

async function api<T>(path:string,body?:unknown):Promise<T>{
  const r=await fetch(path,body===undefined?undefined:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const value=await r.json();if(!r.ok)throw new Error(value.message);return value;
}
const labels:Record<string,string>={UNPAID:'Not paid',CREATING:'Order creation started or interrupted — inspect the Sandbox order before retrying',CREATED:'Awaiting PayPal buyer approval',CAPTURING:'Capture started or interrupted — inspect the Sandbox order; do not pay again',REVIEW_REQUIRED:'Payment needs review — do not pay again',PAID:'Paid · Sandbox capture verified'};
export function OfferPayment({inquiry,traveler}:{inquiry:Inquiry;traveler:boolean}){
  const base=`/api/inquiries/${inquiry.id}`;
  const [payment,setPayment]=useState<PaymentView>();const [armed,setArmed]=useState(false);const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');const container=useRef<HTMLDivElement>(null);const active=useRef(false);
  const refresh=async()=>{const value=await api<PaymentView>(`${base}/payment`);setPayment(value);return value;};
  useEffect(()=>{void refresh().catch(e=>setMessage(e.message));},[inquiry.id]);
  useEffect(()=>{
    if(!armed||!traveler||inquiry.status!=='BUYER_ACCEPTED')return;
    let disposed=false;
    async function setup(){
      try{
        const config=await api<{clientId:string;configured:boolean}>('/api/config');
        if(!config.configured)throw new Error('Configure Sandbox credentials locally before checkout.');
        await loadSDK();const instance=await window.paypal.createInstance({clientId:config.clientId,components:['paypal-payments']});
        if(!(await instance.findEligibleMethods()).isEligible('paypal'))throw new Error('PayPal is not eligible in this browser.');
        const session=await instance.createPayPalOneTimePaymentSession({
          onApprove:async({orderId})=>{
            try{const result=await api<PaymentView>(`${base}/payment/orders/${orderId}/capture`,{});setPayment(result);setMessage('Paid — sandbox capture verified. Follow the collection instructions below.');}
            catch(e){setMessage((e as Error).message);await refresh().catch(()=>{});}
            finally{active.current=false;setBusy(false);}
          },
          onCancel:()=>{active.current=false;setBusy(false);setMessage('PayPal checkout cancelled. No completed payment has been confirmed.');void refresh().catch(()=>{});},
          onError:()=>{active.current=false;setBusy(false);setMessage('PayPal checkout failed. Refresh payment status before another attempt.');void refresh().catch(()=>{});}
        });
        if(disposed||!container.current)return;
        const button=document.createElement('paypal-button');
        button.addEventListener('click',()=>{
          if(active.current)return;active.current=true;setBusy(true);setMessage('Waiting for PayPal buyer approval…');
          const order=api<{orderId:string}>(`${base}/payment/orders`,{version:inquiry.offer!.version});
          // Start synchronously with the promise to preserve popup user activation.
          void session.start({presentationMode:'auto'},order).catch(e=>{active.current=false;setBusy(false);setMessage(e.message);void refresh().catch(()=>{});});
        });
        container.current.replaceChildren(button);
      }catch(e){if(!disposed){setMessage((e as Error).message);setArmed(false);}}
    }
    void setup();return()=>{disposed=true;container.current?.replaceChildren();};
  },[armed,traveler,inquiry.id,inquiry.acceptedVersion]);
  async function collect(action:string){setBusy(true);try{setPayment(await api<PaymentView>(`${base}/collection`,{action}));setMessage('Collection status recorded for this demonstration.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
  const canPay=payment&&['UNPAID','CREATED'].includes(payment.status)&&inquiry.status==='BUYER_ACCEPTED';
  const paid=payment?.status==='PAID';const o=inquiry.offer!;
  return <div className="purchase-flow" aria-live="polite"><h3>Pay → Collect</h3><strong>{payment?labels[payment.status]??'Payment not confirmed':'Loading payment status…'}</strong>
    {message&&<p role="status">{message}</p>}
    {traveler&&canPay&&<><p>Pay exactly {o.currency} {o.amount} for this accepted offer using a Personal sandbox buyer. No real money.</p>
      {!armed&&<button disabled={busy} onClick={()=>setArmed(true)}>Start PayPal sandbox checkout</button>}
      {armed&&<div ref={container} className={busy?'payment busy':'payment'}/>}</>}
    {payment?.orderId&&<p>Order: {payment.orderId}</p>}{payment?.captureId&&<p>Capture: {payment.captureId}</p>}
    <button disabled={busy} onClick={()=>void refresh().catch(e=>setMessage(e.message))}>Refresh this purchase</button>
    {paid&&<><h3>Local collection instructions</h3><dl><dt>Collect from</dt><dd>{o.pickupLocation}</dd><dt>Merchant ready-by time</dt><dd>{new Date(o.readyAt).toLocaleString('en-ZA',{timeZone:'Africa/Johannesburg'})} SAST</dd><dt>Collect before departure</dt><dd>{new Date(inquiry.input.departure).toLocaleString('en-ZA',{timeZone:'Africa/Johannesburg'})} SAST</dd><dt>Terms</dt><dd>{o.collectionTerms}</dd></dl>
      <p><strong>{payment.collection==='HANDOVER_RECORDED'?'Both parties recorded handover':payment.merchantReady?'Merchant marked ready for collection':'Awaiting merchant readiness confirmation'}</strong></p>
      {!traveler&&!payment.merchantReady&&<button disabled={busy} onClick={()=>void collect('ready')}>Mark ready for collection</button>}
      {payment.merchantReady&&<><p>Traveler handover: {payment.travelerHandover?'recorded':'not recorded'} · Merchant handover: {payment.merchantHandover?'recorded':'not recorded'}</p>
        {traveler&&!payment.travelerHandover&&<button disabled={busy} onClick={()=>void collect('traveler-handover')}>Record traveler collection (demo)</button>}
        {!traveler&&!payment.merchantHandover&&<button disabled={busy} onClick={()=>void collect('merchant-handover')}>Record merchant handover (demo)</button>}</>}
      <p className="small">These local demo declarations are not independent proof of fulfillment. No shipment or delivery.</p>
    </>}
  </div>;
}
