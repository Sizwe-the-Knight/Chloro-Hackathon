import { useEffect, useState, type FormEvent } from 'react';
import type { Inquiry, MerchantOffer } from '../shared/inquiry.js';
import {OfferPayment} from './OfferPayment.js';
import {PAYMENT_CURRENCIES} from '../shared/commerce.js';
import {TravelerHome} from './TravelerHome.js';
import {demoMerchants,merchantById,merchantForInquiry,matchesMerchant,type MerchantId} from '../shared/merchants.js';

type View = {inquiries:Inquiry[];ai:{configured:boolean;model:string;day:string;used:number;limit:number;paused?:string}};
async function api<T>(path:string,body?:unknown):Promise<T> {
  const r=await fetch(path,body===undefined?undefined:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json();if(!r.ok)throw new Error(data.message);return data;
}
const time=(value:string)=>new Date(value).toLocaleString('en-ZA',{timeZone:'Africa/Johannesburg'})+' SAST';
const localTime=(value:string)=>value+':00+02:00';
const statusLabel:Record<Inquiry['status'],string>={INTERPRETING:'Interpreting with Gemini',AI_ERROR:'AI unavailable',NEEDS_CLARIFICATION:'Clarification needed',AWAITING_MERCHANT:'Awaiting merchant',MERCHANT_REVIEW:'Merchant reviewing',DECLINED:'Declined by merchant',OFFER_APPROVED:'Offer approved — traveler review',BUYER_ACCEPTED:'Offer accepted'};
export function InquiryExperience() {
  const [screen,setScreen]=useState<'home'|'inquiry'|'request'|'saved'>('home');
  const [role,setRole]=useState<'traveler'|'merchant'>('traveler');
  const [category,setCategory]=useState<'all'|'food'|'crafts'>('all');
  const [message,setMessage]=useState('');const [destination,setDestination]=useState('');
  const [merchantId,setMerchantId]=useState<MerchantId>('craft');
  const [view,setView]=useState<View>();const [selected,setSelected]=useState('');
  const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');
  async function refresh(){const next=await api<View>('/api/inquiries');setView(next);return next;}
  useEffect(()=>{void refresh().catch(e=>setNotice(e.message));},[]);
  useEffect(()=>{document.getElementById(screen==='home'?'home-title':'workspace-title')?.focus();},[screen,role]);
  async function action(task:()=>Promise<unknown>){setBusy(true);setNotice('');try{await task();await refresh();}catch(e){setNotice((e as Error).message);}finally{setBusy(false);}}
  const inquiry=view?.inquiries.find(i=>i.id===selected)??view?.inquiries.at(-1);
  const merchant=merchantById(merchantId)!;
  const requestMerchant=inquiry&&merchantForInquiry(inquiry);
  const saved=demoMerchants.filter(m=>view?.inquiries.some(i=>merchantForInquiry(i)?.id===m.id));
  function navigate(next:typeof screen,nextRole:typeof role='traveler'){if(busy)return;setScreen(next);setRole(nextRole);}
  const begin=()=>{setMerchantId(category==='food'||/\bkotas?\b/i.test(message)?'food':'craft');navigate('inquiry');};
  const openMerchant=(id:MerchantId)=>{setMerchantId(id);navigate('inquiry');};
  const openSaved=(id:MerchantId)=>{setSelected(view?.inquiries.filter(i=>merchantForInquiry(i)?.id===id).at(-1)?.id??'');navigate('request');};
  function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);
    const original=message.trim()+(destination.trim()?'\nTraveler-entered destination context: '+destination.trim():'');
    const input={merchantId,message:original,travelerLanguage:f.get('language'),budget:Number(f.get('budget')).toFixed(2),currency:f.get('currency'),departure:localTime(String(f.get('departure')))};
    void action(async()=>{const i=await api<Inquiry>('/api/inquiries',input);setSelected(i.id);setScreen('request');if(i.error)setNotice(i.error);});}
  const mutate=(suffix:string,body:unknown)=>action(()=>api('/api/inquiries/'+inquiry!.id+'/'+suffix,body));
  return <div className="inquiry-experience">
    <nav className="primary-nav" aria-label="Chloro areas"><div className="traveler-links"><button disabled={busy} aria-current={role==='traveler'&&screen!=='saved'?'page':undefined} onClick={()=>navigate('home')}>Local Offerings</button><button disabled={busy} aria-current={screen==='saved'?'page':undefined} onClick={()=>navigate('saved')}>Saved Merchants</button></div><button className="merchant-link" disabled={busy} aria-current={role==='merchant'?'page':undefined} onClick={()=>navigate('request','merchant')}>Merchant Holdings <span aria-hidden="true">↗</span></button></nav>
    {notice&&<p role="alert" className="notice">{notice}</p>}
    {(screen==='home'||screen==='saved')&&<>{screen==='saved'&&<h1 id="workspace-title" tabIndex={-1}>A few familiar faces.</h1>}<TravelerHome message={message} destination={destination} setMessage={setMessage} setDestination={setDestination} begin={begin} category={category} setCategory={setCategory} saved={saved} savedOnly={screen==='saved'} openMerchant={openMerchant} openSaved={openSaved}/></>}
    {(screen==='inquiry'||screen==='request')&&<>
      <div className="workspace-heading"><div><p className="eyebrow">{role==='merchant'?'MERCHANT AREA · LOCAL DEMONSTRATION':'YOUR LOCAL CONNECTION'}</p><h1 id="workspace-title" tabIndex={-1}>{role==='merchant'?'Merchant Holdings':screen==='inquiry'?'Make it your own.':'Your local request.'}</h1></div><button className="secondary-action" disabled={busy} onClick={()=>role==='merchant'?navigate('request'):navigate('request','merchant')}>{role==='merchant'?'Review as traveler':'Open Merchant Holdings'}</button></div>
      <div className="journey-strip" aria-label="Commerce stages"><span>01 Discover</span><span>02 Inquire</span><span>03 Commit</span><span className="pay-step">04 Pay</span><span>05 Collect</span></div>
      <p className="role-note" role="status">{role==='merchant'?'Merchant controls: review the original request, set and approve exact terms, then mark paid purchases ready.':'Traveler controls: describe your request, review the approved offer, and explicitly accept before checkout.'} Both roles are local demo views, without authentication.</p>
      {screen==='inquiry'&&role==='traveler'&&<div className="inquiry-layout"><section className="inquiry-form"><p className="eyebrow">AI-ASSISTED INQUIRY</p><h2>What are you looking for?</h2><form onSubmit={submit}><fieldset disabled={busy}><legend className="sr-only">Your inquiry</legend>
        <label>Demonstration merchant<select value={merchantId} onChange={e=>setMerchantId(e.target.value as MerchantId)}>{demoMerchants.map(m=><option key={m.id} value={m.id}>{m.name} · {m.category}</option>)}</select></label>
        <label>Describe your request<textarea name="message" required maxLength={1800} value={message} onChange={e=>setMessage(e.target.value)} placeholder="An item, a style, a size… tell the merchant what matters."/></label>
        <label>Destination (optional)<input value={destination} maxLength={80} onChange={e=>setDestination(e.target.value)} placeholder="User-entered context only"/></label>
        <div className="fields"><label>Your language<input name="language" required maxLength={50} defaultValue="English"/></label><label>Spending limit<input name="budget" type="number" required min="0.01" max="999999.99" step="0.01" placeholder="40.00"/></label><label>Budget currency<select name="currency"><option>USD</option><option>ZAR</option><option>EUR</option><option>GBP</option></select></label></div>
        <label>Latest collection / departure (SAST)<input name="departure" type="datetime-local" required/></label><p className="small">Use fictional details. Gemini translates and organizes your request for this merchant. It cannot set a price, promise availability or decide to pay.</p>
        <button className="primary-action" disabled={!view?.ai.configured||!!view.ai.paused||view.ai.used>=20} type="submit">{busy?'Interpreting…':'Send inquiry to Gemini'} <span aria-hidden="true">↗</span></button>
      </fieldset></form></section><aside className="inquiry-context"><p className="eyebrow">DISCOVERED MERCHANT PASSPORT</p><h2>{merchant.name}</h2><p>{merchant.category} · {merchant.requests}</p><p>English-speaking fictional demonstration merchant. Local collection only; the merchant must confirm location, price and readiness.</p><span className="category-label">NO LIVE INVENTORY OR AVAILABILITY CLAIM</span><p className="small">Two fictional profiles share one Sandbox seller account, with no separate payouts. Select the intended merchant before submitting; destination does not imply coverage.</p>{merchant.id==='food'&&<p className="small">Include quantity, food preferences and collection deadline. Confirm ingredients and any dietary concerns directly with the demo merchant; AI cannot promise allergen safety.</p>}<button className="text-button" disabled={busy} onClick={()=>navigate('home')}>Back to Local Offerings</button></aside></div>}
      <div className="workspace-toolbar"><p className="small">AI attempts today: {view?.ai.used??'—'} / 20 (SAST). {view&&!view.ai.configured?'Gemini is disabled or missing local Free Tier configuration.':''} {view&&view.ai.used>=20?'Daily limit reached. Do not activate billing or reset the counter.':''}</p><button className="text-button" disabled={busy} onClick={()=>void action(refresh)}>Refresh inquiries</button>{role==='traveler'&&<button className="text-button" disabled={busy} onClick={begin}>New inquiry</button>}</div>
      {view?.ai.paused&&<p role="alert" className="notice">{view.ai.paused}</p>}
      {screen==='request'&&<>
        {!!view?.inquiries.length&&<div className="request-picker"><label>Saved inquiry<select disabled={busy} value={inquiry?.id??''} onChange={e=>setSelected(e.target.value)}>{[...view.inquiries].reverse().map(i=><option value={i.id} key={i.id}>{merchantForInquiry(i)?.name??i.merchant} · {i.input.message.slice(0,45)} · {statusLabel[i.status]}</option>)}</select></label><p className="small">New inquiries leave earlier purchases intact. Never delete a paid record to repeat checkout.</p></div>}
        {inquiry?<section className="request-card" key={inquiry.id}><div className="section-heading"><h2>{role==='merchant'?'Review this request':'Your inquiry, understood.'}</h2><span className="status-pill">{statusLabel[inquiry.status]}</span></div>
          <p><strong>Merchant: {inquiry.merchant}</strong></p>
          {inquiry.error&&<p role="alert" className="notice">{inquiry.error}</p>}
          {inquiry.interpretation&&<><p className="interpretation-summary">{inquiry.interpretation.travelerSummary}</p>
            {requestMerchant&&matchesMerchant(requestMerchant,inquiry.interpretation.item)?<div className="match-note"><strong>Your selected demo merchant can review this request type</strong><p>{requestMerchant.name} · {requestMerchant.requests}. This is not a promise of stock, price, destination coverage or a pickup time.</p></div>:<div className="empty-state" role="status"><h3>No supported request-type match for the selected merchant.</h3><p>The two demo profiles handle bracelets or kotas. Review the original with the merchant or start a new inquiry with the intended profile. No availability has been invented and this inquiry has not been reassigned.</p><button className="secondary-action" disabled={busy} onClick={()=>navigate('home')}>Explore Local Offerings</button></div>}
          </>}
          <details className="interpretation-details" open={!inquiry.offer||role==='merchant'}><summary>Original request & structured AI interpretation</summary>
          <dl><dt>Original traveler message ({inquiry.input.travelerLanguage})</dt><dd className="preserve">{inquiry.input.message}</dd><dt>Traveler spending limit</dt><dd>{inquiry.input.currency} {inquiry.input.budget}</dd><dt>Latest collection / departure</dt><dd>{time(inquiry.input.departure)}</dd></dl>
          {inquiry.interpretation&&<><h3>Gemini interpretation · review for accuracy</h3><dl><dt>Translated request for merchant (English)</dt><dd className="preserve">{inquiry.interpretation.translatedRequest}</dd><dt>Requested item</dt><dd>{inquiry.interpretation.item??'Not specified — clarification needed'}</dd><dt>Preferences</dt><dd>{inquiry.interpretation.preferences.join('; ')||'None specified'}</dd><dt>Budget interpretation</dt><dd>{inquiry.interpretation.budgetConstraint??'Not extracted'}</dd><dt>Deadline interpretation</dt><dd>{inquiry.interpretation.deadlineConstraint??'Not extracted'}</dd><dt>Other constraints</dt><dd>{inquiry.interpretation.constraints.join('; ')||'None specified'}</dd><dt>Missing details / clarification questions</dt><dd>{inquiry.interpretation.missingDetails.join('; ')||'None flagged — still review the original'}</dd><dt>Uncertainty</dt><dd>{inquiry.interpretation.uncertainties.join('; ')||'None flagged — interpretation may still contain errors'}</dd></dl><p className="small">AI organizes the request. The merchant alone determines the final item, price and collection time.</p></>}
          </details>
          {inquiry.status==='DECLINED'&&<p>Merchant response: {inquiry.declineReason}</p>}
          {role==='merchant'&&['AWAITING_MERCHANT','NEEDS_CLARIFICATION','MERCHANT_REVIEW'].includes(inquiry.status)&&<div className="merchant-actions"><button disabled={busy||inquiry.status==='MERCHANT_REVIEW'} onClick={()=>void mutate('review',{action:'accept'})}>Accept inquiry for review</button><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void mutate('review',{action:'decline',reason:f.get('reason')});}}><label>Reason for declining<input name="reason" required maxLength={500}/></label><button className="secondary-action" disabled={busy}>Decline inquiry</button></form></div>}
          {role==='merchant'&&inquiry.status==='MERCHANT_REVIEW'&&<><p className="small">Confirm the complete item and quantity, exact total price, collection location and ready-by time. Nothing here is pre-approved by AI.</p><MerchantForm busy={busy} approve={body=>mutate('offer',body)}/></>}
          {inquiry.offer&&<OfferReview inquiry={inquiry} traveler={role==='traveler'} busy={busy} accept={()=>mutate('accept',{version:inquiry.offer!.version,accepted:true})}/>}
        </section>:<section className="empty-state"><h2>No inquiries yet.</h2><p>Start in Local Offerings to prepare a traveler request. Nothing is generated until the traveler explicitly submits it.</p><button className="secondary-action" onClick={begin}>Prepare an inquiry</button></section>}
      </>}
    </>}
    <p className="demo-disclosure">Fictional demonstration merchants · One PayPal Sandbox business account · Local collection only · No real money</p>
  </div>;
}

function MerchantForm({busy,approve}:{busy:boolean;approve:(body:MerchantOffer&{approved:boolean})=>Promise<void>}) {
  function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);void approve({description:String(f.get('description')),
    amount:Number(f.get('amount')).toFixed(2),currency:String(f.get('currency')),readyAt:localTime(String(f.get('readyAt'))),pickupLocation:String(f.get('pickupLocation')),
    collectionTerms:String(f.get('collectionTerms')),clarification:String(f.get('clarification')),approved:f.get('approved')==='on'});}
  return <form onSubmit={submit}><fieldset disabled={busy}><legend>Merchant’s final offer</legend>
    <label>Exact item / service description<textarea name="description" required maxLength={1000}/></label>
    <div className="fields"><label>Exact price<input name="amount" type="number" min="0.01" max="999999.99" step="0.01" required/></label>
    <label>Currency<select name="currency">{PAYMENT_CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></label></div>
    <p className="small">PayPal offer currencies: USD, EUR or GBP. No currency conversion is performed.</p>
    <label>Ready for collection (SAST)<input name="readyAt" type="datetime-local" required/></label>
    <label>Collection location<input name="pickupLocation" required maxLength={500}/></label>
    <label>Collection terms<textarea name="collectionTerms" required maxLength={1000}/></label>
    <label>Clarifications agreed with the traveler<textarea name="clarification" maxLength={1000} placeholder="Resolve any missing details or uncertainty before approving."/></label>
    <label className="check"><input name="approved" type="checkbox" required/> I have reviewed the original and interpretation, resolved any uncertainty with the traveler, and approve these exact terms.</label>
    <button>Approve final offer</button>
  </fieldset></form>;
}
function OfferReview({inquiry,traveler,busy,accept}:{inquiry:Inquiry;traveler:boolean;busy:boolean;accept:()=>Promise<void>}) {
  const [accepted,setAccepted]=useState(false);const o=inquiry.offer!;
  return <div className="approved-offer"><p className="eyebrow">MERCHANT-APPROVED OFFER · v{o.version}</p><h3>{o.description}</h3><p className="price">{o.currency} {o.amount}</p>
    {o.currency!==inquiry.input.currency&&<p role="alert">Offer currency differs from your budget. No currency conversion or budget comparison has been made. Check your spending limit before accepting.</p>}
    <dl><dt>Ready for local collection</dt><dd>{time(o.readyAt)}</dd><dt>Collect no later than departure</dt><dd>{time(inquiry.input.departure)}</dd><dt>Location</dt><dd>{o.pickupLocation}</dd><dt>Terms</dt><dd>{o.collectionTerms}</dd><dt>Merchant clarification</dt><dd>{o.clarification||'None added'}</dd></dl>
    {traveler&&inquiry.status==='OFFER_APPROVED'&&<><label className="check"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/> I accept this exact {o.currency} {o.amount} offer and its collection terms.</label><button disabled={!accepted||busy} onClick={()=>void accept()}>Accept merchant offer</button></>}
    {inquiry.status==='BUYER_ACCEPTED'&&<p><strong>Traveler accepted offer v{inquiry.acceptedVersion}.</strong></p>}
    <p className="small">Accepting an offer does not move money. PayPal checkout requires a separate traveler action.</p>
    {inquiry.status==='BUYER_ACCEPTED'&&<OfferPayment inquiry={inquiry} traveler={traveler}/>}
  </div>;
}
