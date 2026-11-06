import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { Router } from 'express';
import { InquiryService, recoverInterruptedInquiries, type InquiryState, type Interpreter } from './inquiry.js';
import { Gemini } from './gemini.js';
import { CommerceService, type CommerceState } from './commerce.js';
import type { Gateway } from './payment.js';

export function inquiryRouter(gateway:Gateway,reservedOrderIds:()=>string[],options:{dataDir?:string;ai?:Interpreter}={}) {
  const router=Router();
  const dir=resolve(options.dataDir??'local-data');
  const file=resolve(dir,'inquiries.json');
  mkdirSync(dir,{recursive:true});
  let state:InquiryState=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{inquiries:[],usage:{day:'',count:0,lastAt:0}};
  const save=(s:InquiryState)=>{
    writeFileSync(`${file}.tmp`,JSON.stringify(s),{mode:0o600});renameSync(`${file}.tmp`,file);state=s;
  };
  const recovered=recoverInterruptedInquiries(state);if(recovered)save(recovered);
  const service=new InquiryService({get:()=>state,save},options.ai??new Gemini());
  const purchaseFile=resolve(dir,'commerce.json');
  let purchases:CommerceState=existsSync(purchaseFile)?JSON.parse(readFileSync(purchaseFile,'utf8')):{purchases:{}};
  const commerce=new CommerceService({get:()=>purchases,save:next=>{
    writeFileSync(`${purchaseFile}.tmp`,JSON.stringify(next),{mode:0o600});renameSync(`${purchaseFile}.tmp`,purchaseFile);purchases=next;
  }},id=>service.view().inquiries.find(i=>i.id===id),gateway,reservedOrderIds);
  router.get('/',(_req,res)=>res.json(service.view()));
  router.post('/',async(req,res)=>res.json(await service.submit(req.body)));
  router.post('/:id/review',(req,res)=>res.json(service.review(req.params.id,req.body.action,req.body.reason)));
  router.post('/:id/reply',async(req,res)=>res.json(await service.translateMerchantReply(req.params.id,req.body)));
  router.post('/:id/offer',(req,res)=>res.json(service.approve(req.params.id,req.body)));
  router.post('/:id/accept',(req,res)=>res.json(service.acceptOffer(req.params.id,req.body.version,req.body.accepted)));
  router.get('/:id/payment',(req,res)=>res.json(commerce.status(req.params.id)));
  router.post('/:id/payment/orders',async(req,res)=>res.json(await commerce.create(req.params.id,req.body.version)));
  router.post('/:id/payment/orders/:orderId/capture',async(req,res)=>res.json(await commerce.capture(req.params.id,req.params.orderId)));
  router.post('/:id/collection',(req,res)=>res.json(commerce.collect(req.params.id,req.body.action)));
  return router;
}
