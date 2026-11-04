import {PaymentError, PaymentService, fingerprint, type Quote, type Gateway, type RecordState} from './payment.js';
import type {Inquiry} from '../shared/inquiry.js';
import type {PaymentView} from '../shared/commerce.js';
import {PAYMENT_CURRENCIES} from '../shared/commerce.js';

type Purchase = {payment?:RecordState; merchantReady?:boolean; travelerHandover?:boolean; merchantHandover?:boolean};
export type CommerceState = {purchases:Record<string,Purchase>};
export interface CommerceStore {get():CommerceState;save(state:CommerceState):void}

// Adapt each accepted inquiry to the existing payment engine. Never touches M1's store.
export class CommerceService {
  private services=new Map<string,PaymentService>();
  constructor(private store:CommerceStore,private inquiry:(id:string)=>Inquiry|undefined,private gateway:Gateway,
    private reservedOrderIds:()=>string[]=()=>[]) {}
  private source(id:string) {
    const i=this.inquiry(id);if(!i)throw new PaymentError('Inquiry not found.',404);return i;
  }
  private quote(id:string):Quote {
    const i=this.source(id);const o=i.offer;
    if(i.status!=='BUYER_ACCEPTED'||!o?.merchantApproved||i.acceptedVersion!==o.version)
      throw new PaymentError('Merchant approval and traveler acceptance of this exact offer are required.');
    if(!PAYMENT_CURRENCIES.includes(o.currency))throw new PaymentError('This offer currency cannot use PayPal checkout. Request a supported merchant offer; no automatic conversion is allowed.');
    return {id:`inquiry-${i.id}`,version:o.version,merchantApproved:o.merchantApproved,merchant:i.merchant,
      product:o.description,amount:o.amount,currency:o.currency,pickupLocation:o.pickupLocation,readyAt:o.readyAt,
      pickupBy:i.input.departure,collectionTerms:JSON.stringify({terms:o.collectionTerms,clarification:o.clarification})};
  }
  private save(id:string,change:(p:Purchase)=>void) {
    const next=structuredClone(this.store.get());const p=next.purchases[id]??={};change(p);this.store.save(next);
  }
  private engine(id:string) {
    let service=this.services.get(id);
    if(!service){
      service=new PaymentService({get:()=>structuredClone(this.store.get().purchases[id]?.payment),save:r=>this.save(id,p=>{p.payment=r;})},{
        create:async(body,key)=>{
          const order=await this.gateway.create(body,key);
          if(this.reservedOrderIds().includes(order.id)||Object.entries(this.store.get().purchases).some(([other,p])=>other!==id&&p.payment?.orderId===order.id))
            throw new PaymentError('PayPal order is already associated with another purchase. Payment blocked.',502);
          return order;
        },
        capture:(order,key)=>this.gateway.capture(order,key)
      },()=>this.quote(id));
      this.services.set(id,service);
    }
    return service;
  }
  status(id:string):PaymentView {
    this.source(id);const p=this.store.get().purchases[id];const paid=p?.payment?.status==='PAID';
    return {...this.engine(id).status(),collection:!paid?'NOT_PAID':p?.merchantReady?(p.travelerHandover&&p.merchantHandover?'HANDOVER_RECORDED':'READY'):'AWAITING_READY',
      merchantReady:!!p?.merchantReady,travelerHandover:!!p?.travelerHandover,merchantHandover:!!p?.merchantHandover};
  }
  async create(id:string,version:unknown) {
    const q=this.quote(id);
    if(version!==q.version)throw new PaymentError('Offer version changed. Review and accept the current terms.');
    // Acceptance is checked in persisted inquiry state, never trusted from a POST amount or approval flag.
    return this.engine(id).create(fingerprint(q),true);
  }
  async capture(id:string,orderId:string) {
    this.quote(id);await this.engine(id).capture(orderId);return this.status(id);
  }
  collect(id:string,action:unknown) {
    const q=this.quote(id);const p=this.store.get().purchases[id];
    if(p?.payment?.status!=='PAID'||p.payment.accepted!==fingerprint(q))throw new PaymentError('Verified payment for this exact offer is required before collection.');
    if(action==='ready')this.save(id,p=>{p.merchantReady=true;});
    else if(action==='traveler-handover'||action==='merchant-handover'){
      if(!p.merchantReady)throw new PaymentError('Merchant must mark the purchase ready first.');
      this.save(id,p=>{if(action==='traveler-handover')p.travelerHandover=true;else p.merchantHandover=true;});
    }else throw new PaymentError('Unknown collection action.',422);
    return this.status(id);
  }
}
