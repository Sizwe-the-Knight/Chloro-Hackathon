// Fictional profiles only. Both use the same configured Sandbox business/app.
export const demoMerchants = [
  {id:'craft',name:'Chloro Craft Studio',storedName:'Chloro Craft Studio (seeded demonstration merchant)',
    category:'Goods & Crafts',filter:'crafts',language:'Spanish',requests:'Handmade bracelet requests'},
  {id:'food',name:'Chloro Kota Counter',storedName:'Chloro Kota Counter (seeded demonstration merchant)',
    category:'Food & Drink',filter:'food',language:'isiZulu',requests:'Kota requests · quantity and dietary preferences for human review'}
] as const;
export type DemoMerchant = typeof demoMerchants[number];
export type MerchantId = DemoMerchant['id'];
export type MerchantLanguage = DemoMerchant['language'];
export function merchantById(id:unknown) {return demoMerchants.find(m=>m.id===id);}
export function merchantForInquiry(i:{merchantId?:string;merchant:string}) {
  // Pre-M5.1 inquiries have no ID. Resolve by their original name, without rewriting receipts.
  const m=i.merchantId===undefined?demoMerchants.find(m=>m.storedName===i.merchant):merchantById(i.merchantId);
  return m?.storedName===i.merchant?m:undefined;
}
export function matchesMerchant(merchant:DemoMerchant,item:string|null|undefined) {
  return !!item&&(merchant.id==='craft'?/\b(bracelets?|bangles?)\b/i:/\b(kotas?)\b/i).test(item);
}
