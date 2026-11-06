import type {FormEvent} from 'react';
import {demoMerchants,type DemoMerchant,type MerchantId} from '../shared/merchants.js';
type Props={message:string;destination:string;setMessage:(v:string)=>void;setDestination:(v:string)=>void;begin:()=>void;
  category:'all'|'food'|'crafts';setCategory:(v:'all'|'food'|'crafts')=>void;saved:DemoMerchant[];savedOnly:boolean;openMerchant:(id:MerchantId)=>void;openSaved:(id:MerchantId)=>void};
export function TravelerHome(p:Props){
  function submit(e:FormEvent){e.preventDefault();p.begin();}
  return <>
    {!p.savedOnly&&<section className="home-hero" aria-labelledby="home-title"><div className="hero-copy"><p className="eyebrow"><span className="tiny-leaf" aria-hidden="true"/> A LITTLE LOCAL KNOWLEDGE</p><h1 id="home-title" tabIndex={-1}>Find something local.</h1><p className="hero-description">Tell us what you have in mind. Chloro helps translate your request, agree on the details with a local merchant, and collect something made for you.</p>
      <form className="ai-composer" onSubmit={submit}><label htmlFor="home-request">What are you looking for?</label><textarea id="home-request" required maxLength={1800} value={p.message} onChange={e=>p.setMessage(e.target.value)} placeholder="A handmade blue bracelet, or two kotas to collect before departure…"/>
        <div className="composer-bottom"><label htmlFor="destination"><span>Destination <span className="optional">(optional)</span></span><input id="destination" maxLength={80} value={p.destination} onChange={e=>p.setDestination(e.target.value)} placeholder="Where are you planning to visit?" autoComplete="off"/></label><button className="primary-action" type="submit">Prepare my inquiry <span aria-hidden="true">↗</span></button></div>
        <p className="composer-note">Next: review the demo merchant, budget and pickup deadline. AI runs only when you choose “Send inquiry to Gemini.” Your destination is context, not a location lookup.</p>
      </form></div>
      <aside className="how-it-works" aria-label="How Chloro works"><span className="leaf-art" aria-hidden="true"/><p className="eyebrow">LOCAL, WITH A LITTLE HELP</p><h2>Your words.<br/>A human agreement.</h2><ol><li><strong>Describe it</strong><span>AI translates and organizes your request.</span></li><li><strong>Agree together</strong><span>The merchant confirms the exact offer.</span></li><li><strong>Pay & collect</strong><span>You approve Sandbox checkout, then collect locally.</span></li></ol></aside>
    </section>}
    {!p.savedOnly&&<section className="offerings-section" aria-labelledby="offerings-title"><div className="section-heading"><div><p className="eyebrow">A SMALL PLACE TO START</p><h2 id="offerings-title">Explore local offerings</h2></div><button className="text-button" onClick={()=>p.setCategory('all')} aria-pressed={p.category==='all'}>All categories</button></div>
      <div className="category-grid"><button className={`category-card ${p.category==='food'?'selected':''}`} aria-pressed={p.category==='food'} onClick={()=>p.setCategory('food')}><span className="category-mark food-mark" aria-hidden="true">◡</span><span><strong>Food & Drink</strong><small>Kota requests · fictional demonstration</small></span><span aria-hidden="true">→</span></button>
      <button className={`category-card ${p.category==='crafts'?'selected':''}`} aria-pressed={p.category==='crafts'} onClick={()=>p.setCategory('crafts')}><span className="category-mark craft-mark" aria-hidden="true">◎</span><span><strong>Goods & Crafts</strong><small>Personal touches, made by hand</small></span><span aria-hidden="true">→</span></button></div>
      {demoMerchants.filter(m=>p.category==='all'||m.filter===p.category).map(m=><MerchantCard key={m.id} merchant={m} action={()=>p.openMerchant(m.id)}/>)}
    </section>}
    <section className="saved-section" aria-labelledby="saved-title"><div className="section-heading"><div><p className="eyebrow">FAMILIAR FACES, SAVED LOCALLY</p><h2 id="saved-title">Saved Merchants</h2></div><span className="count-pill">{p.saved.length}</span></div><p className="muted">Keep familiar local connections close. These merchants come from your saved inquiries on this device.</p>
      {p.saved.length?p.saved.map(m=><MerchantCard key={m.id} merchant={m} action={()=>p.openSaved(m.id)} saved/>):<div className="empty-state"><h3>Your local connections start here.</h3><p>A participating merchant will appear here after an inquiry is saved locally.</p><button className="secondary-action" onClick={p.begin}>Prepare an inquiry</button></div>}
    </section>
  </>;
}
export function MerchantCard({merchant,action,saved=false}:{merchant:DemoMerchant;action:()=>void;saved?:boolean}){
  return <article className="merchant-card"><div className="merchant-monogram" aria-hidden="true">{merchant.id==='food'?'k':'c'}<span>✦</span></div><div className="merchant-card-copy"><span className="category-label">{merchant.category.toUpperCase()} · FICTIONAL DEMO</span><h3>{merchant.name}</h3><p>{merchant.requests} · {merchant.language} · local collection</p><small>{saved?'From existing saved inquiries.':'Every price, availability and ready time needs merchant approval. Shared Sandbox seller account.'}</small></div><button className="secondary-action" onClick={action}>{saved?'Open saved inquiries':'View merchant & inquire'} <span aria-hidden="true">→</span></button></article>;
}
