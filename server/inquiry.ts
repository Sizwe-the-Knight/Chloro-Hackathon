import { randomUUID } from 'node:crypto';
import { PaymentError } from './payment.js';
import type { Inquiry, InquiryInput, Interpretation, MerchantOffer } from '../shared/inquiry.js';
import {PAYMENT_CURRENCIES} from '../shared/commerce.js';
import {demoMerchants,merchantById} from '../shared/merchants.js';

export const MODEL = 'gemini-3.5-flash-lite';
export const MERCHANT = demoMerchants[0].storedName;
export const currencies = ['USD', 'ZAR', 'EUR', 'GBP'];
export type InquiryState = {inquiries: Inquiry[]; usage: {day: string; count: number; lastAt: number; paused?: string}};
export interface InquiryStore { get(): InquiryState; save(state: InquiryState): void }
export interface Interpreter { generate(input: InquiryInput): Promise<unknown>; configured(): boolean }
export function recoverInterruptedInquiries(state:InquiryState):InquiryState|undefined {
  if(!state.inquiries.some(i=>i.status==='INTERPRETING'))return;
  const recovered=structuredClone(state);
  for(const i of recovered.inquiries)if(i.status==='INTERPRETING'){
    i.status='AI_ERROR';i.error='The server stopped before this interpretation completed. No AI result was saved. The attempt still counts toward the daily limit; submit a new inquiry only when ready. No automatic retry occurred.';
  }
  return recovered;
}
const invalid = (message: string) => new PaymentError(message, 422);
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid('Expected structured object.');
  return value as Record<string, unknown>;
}
function text(value: unknown, name: string, max = 1000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw invalid(`Provide ${name} (1–${max} characters).`);
  return value.trim();
}
function money(value: unknown): string {
  const result = text(value, 'an exact positive amount', 12);
  if (!/^\d{1,6}\.\d{2}$/.test(result) || Number(result) <= 0) throw invalid('Use a positive amount with two decimals, e.g. 35.00.');
  return Number(result).toFixed(2);
}
function currency(value: unknown): string {
  if (typeof value !== 'string' || !currencies.includes(value)) throw invalid('Choose USD, ZAR, EUR or GBP.'); return value;
}
function date(value: unknown): string {
  const result = text(value, 'date/time with timezone', 40);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(Z|[+-]\d{2}:\d{2})$/.test(result) || !Number.isFinite(Date.parse(result))) throw invalid('Date/time must include a timezone.');
  return new Date(result).toISOString();
}
export function validateInput(value: unknown, now = Date.now()): InquiryInput {
  const v = object(value);
  const merchant=merchantById(v.merchantId===undefined?'craft':v.merchantId);
  if(!merchant)throw invalid('Choose a participating demonstration merchant.');
  const input = {message: text(v.message, 'your inquiry', 2000), travelerLanguage: text(v.travelerLanguage, 'traveler language', 50),
    budget: money(v.budget), currency: currency(v.currency), departure: date(v.departure)};
  if (Date.parse(input.departure) <= now) throw invalid('Departure deadline must be in the future.');
  return {...input,merchantId:merchant.id};
}
const nullableText = (value: unknown, name: string) => value === null ? null : text(value, name);
function list(value: unknown, name: string): string[] {
  if (!Array.isArray(value) || value.length > 12) throw invalid(`Invalid AI ${name}.`);
  return value.map(v => text(v, name, 500));
}
export function validateInterpretation(value: unknown): Interpretation {
  const v = object(value);
  const keys = ['item','preferences','budgetConstraint','deadlineConstraint','constraints','translatedRequest','travelerSummary','missingDetails','uncertainties'];
  if (Object.keys(v).length !== keys.length || Object.keys(v).some(k => !keys.includes(k))) throw invalid('AI response has unexpected or missing fields.');
  const result = {item: nullableText(v.item, 'item'), preferences: list(v.preferences,'preferences'),
    budgetConstraint: nullableText(v.budgetConstraint,'budget constraint'), deadlineConstraint: nullableText(v.deadlineConstraint,'deadline constraint'),
    constraints: list(v.constraints,'constraints'), translatedRequest: text(v.translatedRequest,'translated request',3000),
    travelerSummary: text(v.travelerSummary,'traveler summary',3000), missingDetails:list(v.missingDetails,'missing details'), uncertainties:list(v.uncertainties,'uncertainties')};
  if (!result.item && result.missingDetails.length === 0) throw invalid('AI must flag an unspecified item for clarification.');
  return result;
}
export function parseGeminiResponse(data: unknown): Interpretation {
  const candidates = object(data).candidates;
  if (!Array.isArray(candidates) || candidates.length !== 1 || candidates[0]?.finishReason !== 'STOP') throw invalid('Gemini did not return a complete response. No interpretation was generated.');
  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) throw invalid('Gemini returned no interpretation.');
  const raw = parts.filter(p => !p.thought).map(p => p.text ?? '').join('');
  if (!raw || raw.length > 16000) throw invalid('Gemini returned an empty or oversized interpretation.');
  try {return validateInterpretation(JSON.parse(raw));} catch {throw invalid('Gemini returned invalid structured data. No interpretation was accepted.');}
}
export class InquiryService {
  private busy = false;
  constructor(private store: InquiryStore, private ai: Interpreter, private now: () => number = Date.now) {}
  private day() {return new Date(this.now() + 2*60*60*1000).toISOString().slice(0,10);}
  private state() {
    const state = structuredClone(this.store.get());
    if (state.usage.day !== this.day()) state.usage = {day:this.day(),count:0,lastAt:0};
    return state;
  }
  view() {const s=this.state();return {inquiries:s.inquiries, ai:{configured:this.ai.configured(),model:MODEL,day:s.usage.day,used:s.usage.count,limit:20,paused:s.usage.paused}};}
  async submit(value: unknown) {
    const input = validateInput(value,this.now());
    if (!this.ai.configured()) throw new PaymentError('Gemini is disabled or missing verified Free Tier configuration. No AI request was sent.',503);
    if (this.busy) throw new PaymentError('An inquiry is already being interpreted. Please wait.');
    const s=this.state();
    if (s.usage.paused) throw new PaymentError(s.usage.paused,503);
    if (s.usage.count >= 20) throw new PaymentError('Daily limit reached: 20 AI requests. No request was sent.',429);
    if (s.usage.lastAt && this.now()-s.usage.lastAt < 5000) throw new PaymentError('Wait five seconds between AI requests.',429);
    const merchant=merchantById(input.merchantId)!;
    const inquiry: Inquiry = {id:randomUUID(),createdAt:new Date(this.now()).toISOString(),input,merchantId:merchant.id,merchant:merchant.storedName,merchantLanguage:'English',status:'INTERPRETING'};
    s.inquiries.push(inquiry); s.usage.count++; s.usage.lastAt=this.now();
    // Persist attempted calls before the network request; failures count toward the hard cap.
    this.store.save(s); this.busy=true;
    try {
      inquiry.interpretation = validateInterpretation(await this.ai.generate(input));
      inquiry.status = inquiry.interpretation.missingDetails.length || inquiry.interpretation.uncertainties.length ? 'NEEDS_CLARIFICATION':'AWAITING_MERCHANT';
    } catch {
      inquiry.status='AI_ERROR'; inquiry.error='Gemini unavailable or invalid response. No interpretation generated. AI calls paused for this SAST day; no automatic retry or paid fallback.';
      s.usage.paused=inquiry.error;
    } finally {this.busy=false; this.store.save(s);}
    return inquiry;
  }
  private update(id:string, change:(inquiry:Inquiry)=>void) {
    if(this.busy) throw new PaymentError('Wait for the current interpretation to finish.');
    const s=this.state();const inquiry=s.inquiries.find(i=>i.id===id);
    if(!inquiry) throw new PaymentError('Inquiry not found.',404);
    change(inquiry);this.store.save(s);return inquiry;
  }
  review(id:string, action:unknown, reason:unknown) {
    return this.update(id,i=>{
      if (!['AWAITING_MERCHANT','NEEDS_CLARIFICATION','MERCHANT_REVIEW'].includes(i.status)) throw new PaymentError('This inquiry cannot be reviewed in its current state.');
      if(action==='accept') i.status='MERCHANT_REVIEW';
      else if(action==='decline') {i.declineReason=text(reason,'a decline reason',500);i.status='DECLINED';}
      else throw invalid('Choose accept or decline.');
    });
  }
  approve(id:string, value:unknown) {
    return this.update(id,i=>{
      if(i.status!=='MERCHANT_REVIEW') throw new PaymentError('Merchant must accept the inquiry for review first.');
      const v=object(value);
      if(v.approved!==true) throw invalid('Merchant must explicitly approve the exact offer.');
      const offer: MerchantOffer = {description:text(v.description,'the final item description'),amount:money(v.amount),currency:currency(v.currency),
        readyAt:date(v.readyAt),pickupLocation:text(v.pickupLocation,'the local collection point',500),collectionTerms:text(v.collectionTerms,'collection terms',1000),
        clarification:typeof v.clarification==='string' ? v.clarification.trim() : ''};
      if(offer.clarification.length>1000) throw invalid('Clarification must be at most 1000 characters.');
      if(!PAYMENT_CURRENCIES.includes(offer.currency))throw invalid('PayPal checkout offers must use USD, EUR or GBP. No currency conversion is performed.');
      if((i.interpretation!.missingDetails.length || i.interpretation!.uncertainties.length) && !offer.clarification) throw invalid('Resolve the flagged missing details/uncertainties in the clarification field before approving.');
      if(Date.parse(offer.readyAt)<=this.now() || Date.parse(offer.readyAt)>Date.parse(i.input.departure)) throw invalid('Ready time must be in the future and no later than departure.');
      if(offer.currency===i.input.currency && Number(offer.amount)>Number(i.input.budget)) throw invalid('Offer exceeds the traveler spending limit.');
      i.offer={...offer,version:1,merchantApproved:true}; i.status='OFFER_APPROVED';
    });
  }
  acceptOffer(id:string, version:unknown, accepted:unknown) {
    return this.update(id,i=>{
      if(i.status!=='OFFER_APPROVED' || !i.offer?.merchantApproved || version!==i.offer.version || accepted!==true) throw new PaymentError('Review and explicitly accept the current merchant-approved offer.');
      if(Date.parse(i.input.departure)<=this.now() || Date.parse(i.offer.readyAt)<=this.now()) throw new PaymentError('Offer collection time has passed.');
      i.acceptedVersion=i.offer.version;i.status='BUYER_ACCEPTED';
      // No PaymentService import/call: acceptance here never creates or captures a PayPal order.
    });
  }
}
