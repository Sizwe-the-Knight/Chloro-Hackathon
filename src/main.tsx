import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Quote } from '../server/payment.js';
import './style.css';
import { InquiryExperience } from './Inquiry.js';
import {loadSDK} from './paypal-sdk.js';

type Offer = Quote & {fingerprint: string};
type Purchase = {status: string; orderId?: string; captureId?: string};
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, body === undefined ? undefined : {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const data = await response.json(); if (!response.ok) throw new Error(data.message); return data;
}
function App() {
  const [offer, setOffer] = useState<Offer>(); const [purchase, setPurchase] = useState<Purchase>({status: 'UNPAID'});
  const [accepted, setAccepted] = useState(false); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Review the merchant-approved offer, then accept its exact terms.');
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => { Promise.all([api<Offer>('/api/quote'), api<Purchase>('/api/purchase')]).then(([q,p]) => {setOffer(q);setPurchase(p);}).catch(e => setMessage(e.message)); }, []);
  useEffect(() => {
    if (!accepted || !offer || !['UNPAID','CREATED'].includes(purchase.status)) return;
    let disposed = false;
    async function init() {
      try {
        const config = await api<{clientId: string; configured: boolean}>('/api/config');
        if (!config.configured) throw new Error('Sandbox credentials are missing. Follow the local setup instructions.');
        await loadSDK();
        const instance = await window.paypal.createInstance({clientId: config.clientId, components: ['paypal-payments']});
        if (!(await instance.findEligibleMethods()).isEligible('paypal')) throw new Error('PayPal is not eligible in this browser.');
        const session = await instance.createPayPalOneTimePaymentSession({
          onApprove: async ({orderId}) => {
            try { const p = await api<Purchase>(`/api/orders/${orderId}/capture`, {}); setPurchase(p); setMessage('Paid — sandbox capture verified. Collect at the agreed counter.'); }
            catch (e) { setMessage((e as Error).message); setPurchase(await api<Purchase>('/api/purchase')); }
            finally { setBusy(false); }
          },
          onCancel: () => {setBusy(false); setMessage('Checkout cancelled. No completed payment has been confirmed.');},
          onError: () => {setBusy(false); setMessage('PayPal checkout failed. Check purchase status before trying again.');}
        });
        if (disposed || !container.current) return;
        const button = document.createElement('paypal-button');
        let opening = false;
        button.addEventListener('click', () => {
          if (opening) return; opening = true; setBusy(true);
          // Invoke before awaiting to preserve the browser's user activation.
          const order = api<{orderId: string}>('/api/orders', {fingerprint: offer!.fingerprint, accepted: true});
          session.start({presentationMode: 'auto'}, order).catch(e => {setMessage(e.message);setBusy(false);}).finally(() => {opening = false;});
        });
        container.current.replaceChildren(button);
      } catch(e) { if (!disposed) setMessage((e as Error).message); }
    }
    void init(); return () => {disposed = true; container.current?.replaceChildren();};
  }, [accepted, offer, purchase.status]);
  return <><a className="skip-link" href="#journey">Skip to commerce journey</a><main id="journey" tabIndex={-1}><header className="app-header"><span className="brand"><span className="brand-leaf" aria-hidden="true"/>chloro<span className="brand-dot">.</span></span><span className="badge">SANDBOX DEMO · NO REAL MONEY</span></header>
    <InquiryExperience/>
    <details><summary>Original M1 sandbox purchase record</summary><p>This preserved demonstration receipt is separate from your current inquiry.</p>
    {offer && <section><p className="eyebrow">MERCHANT-APPROVED OFFER · v{offer.version}</p><h2>{offer.product}</h2><p>{offer.merchant}</p>
      <div className="price">{offer.currency} ${offer.amount}</div><dl><dt>Collection point</dt><dd>{offer.pickupLocation}</dd><dt>Ready for collection</dt><dd>{new Date(offer.readyAt).toLocaleString('en-ZA', {timeZone: 'Africa/Johannesburg'})} SAST</dd><dt>Collect by</dt><dd>{new Date(offer.pickupBy).toLocaleString('en-ZA', {timeZone: 'Africa/Johannesburg'})} SAST</dd></dl><p>{offer.collectionTerms}</p>
      {['UNPAID','CREATED'].includes(purchase.status) && <><label><input type="checkbox" checked={accepted} disabled={busy} onChange={e => setAccepted(e.target.checked)}/> I accept this exact USD $35.00 offer and its collection terms.</label><div ref={container} className={busy ? 'payment busy' : 'payment'}/></>}
    </section>}
    <section aria-live="polite"><strong>{purchase.status === 'PAID' ? 'Paid · Sandbox' : 'Payment not confirmed'}</strong><p>{purchase.status==='PAID'?'Original sandbox capture verified.':message}</p>{purchase.orderId && <p>Order: {purchase.orderId}</p>}{purchase.captureId && <p>Capture: {purchase.captureId}</p>}
      <button disabled={busy} onClick={() => {api<Purchase>('/api/purchase').then(setPurchase).catch(e=>setMessage(e.message));}}>Refresh payment status</button></section>
    </details><footer>One sandbox merchant account backs this demonstration. Local collection only. No live money, escrow, delivery or independent fulfillment verification.</footer>
  </main></>;
}
createRoot(document.getElementById('root')!).render(<App/>);
