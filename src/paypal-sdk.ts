type Session = {start(options: {presentationMode: string}, order: Promise<{orderId: string}>): Promise<void>};
declare global { interface Window { paypal: {createInstance(options: unknown): Promise<{
  findEligibleMethods(): Promise<{isEligible(method: string): boolean}>;
  createPayPalOneTimePaymentSession(options: {onApprove(data: {orderId: string}): Promise<void>; onCancel(): void; onError(): void}): Session;
}>} } }
let sdk:Promise<void>|undefined;
export function loadSDK(){return sdk??=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://www.sandbox.paypal.com/web-sdk/v6/core';
  script.onload=()=>resolve();script.onerror=()=>{sdk=undefined;script.remove();reject(new Error('PayPal sandbox could not load. You may try loading it again manually.'));};document.head.append(script);
});}
