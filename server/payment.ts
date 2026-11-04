import { randomUUID, createHash } from 'node:crypto';

export const quote = {
  id: 'bracelet-demo', version: 1, merchantApproved: true,
  merchant: 'Chloro Craft Studio (seeded demonstration merchant)',
  product: 'Handmade custom bracelet', amount: '35.00', currency: 'USD',
  pickupLocation: 'Demo Craft Studio collection counter, 12 Market Lane (fictional)',
  readyAt: '2026-11-12T12:00:00+02:00', pickupBy: '2026-11-12T17:00:00+02:00',
  collectionTerms: 'Local collection only. Show the payment confirmation at the demo counter. No delivery.'
};
export type Quote = typeof quote;
export const fingerprint = (q: Quote) => createHash('sha256').update(JSON.stringify(q)).digest('hex');
export class PaymentError extends Error {
  constructor(message: string, public code = 409) { super(message); }
}
export type RecordState = { accepted: string; createKey: string; captureKey: string; orderId?: string; status: string; captureId?: string };
export interface Store { get(): RecordState | undefined; save(record: RecordState): void }
export interface Gateway { create(body: unknown, key: string): Promise<any>; capture(id: string, key: string): Promise<any> }

// One seeded purchase, one server process. State is saved before remote calls.
export class PaymentService {
  private busy = false;
  constructor(private store: Store, private gateway: Gateway, private current: () => Quote = () => quote) {}
  private valid(hash: unknown) {
    const q = this.current();
    if (!q.merchantApproved || hash !== fingerprint(q) || Date.now() >= Date.parse(q.pickupBy))
      throw new PaymentError('Quote changed, expired, or is not merchant-approved. Review the current offer.');
    return q;
  }
  status() { const r = this.store.get(); return {status: r?.status ?? 'UNPAID', orderId: r?.orderId, captureId: r?.captureId}; }
  async create(hash: unknown, accepted: unknown) {
    const q = this.valid(hash);
    if (accepted !== true) throw new PaymentError('Accept the exact merchant-approved quote first.');
    if (this.busy) throw new PaymentError('Payment operation in progress.');
    this.busy = true;
    try {
      let r = this.store.get();
      if (r && r.accepted !== hash) throw new PaymentError('Existing purchase has different terms. Payment is blocked.');
      if (r?.orderId) {
        if (r.status !== 'CREATED') throw new PaymentError('This purchase already has a payment attempt. Check its status.');
        return {orderId: r.orderId};
      }
      r ??= {accepted: hash as string, createKey: randomUUID(), captureKey: randomUUID(), status: 'CREATING'};
      this.store.save(r);
      const order = await this.gateway.create({intent: 'CAPTURE', purchase_units: [{
        reference_id: q.id, custom_id: `${q.id}:v${q.version}`, description: q.product,
        amount: {currency_code: q.currency, value: q.amount}
      }], payment_source: {paypal: {experience_context: {shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW'}}}}, r.createKey);
      if (typeof order.id !== 'string' || !/^[A-Z0-9]+$/.test(order.id)) throw new PaymentError('PayPal did not return an order ID.', 502);
      r.orderId = order.id; r.status = 'CREATED'; this.store.save(r);
      return {orderId: r.orderId};
    } finally { this.busy = false; }
  }
  async capture(id: string) {
    const r = this.store.get();
    if (!r || r.orderId !== id) throw new PaymentError('Unknown order for this purchase.');
    if (r.status === 'PAID') return this.status();
    const q = this.valid(r.accepted);
    if (this.busy || r.status !== 'CREATED') throw new PaymentError('Capture already attempted. Do not pay again; check the existing order.');
    this.busy = true;
    r.status = 'CAPTURING'; this.store.save(r);
    try {
      const data = await this.gateway.capture(id, r.captureKey);
      const units = data.purchase_units;
      const unit = Array.isArray(units) && units.length === 1 ? units[0] : undefined;
      const captures = unit?.payments?.captures;
      const cap = Array.isArray(captures) && captures.length === 1 ? captures[0] : undefined;
      if (data.id !== id || data.status !== 'COMPLETED' || unit?.reference_id !== q.id ||
          unit?.custom_id !== `${q.id}:v${q.version}` || cap?.status !== 'COMPLETED' ||
          !cap?.id || cap.amount?.currency_code !== q.currency || cap.amount?.value !== q.amount ||
          (cap.supplementary_data?.related_ids?.order_id && cap.supplementary_data.related_ids.order_id !== id)) {
        throw new PaymentError(`Payment was not verified as completed for ${q.currency} ${q.amount}. Do not pay again; check the sandbox order.`, 422);
      }
      r.status = 'PAID'; r.captureId = cap.id; this.store.save(r);
      return this.status();
    } catch (e) {
      r.status = 'REVIEW_REQUIRED'; this.store.save(r);
      throw e;
    } finally { this.busy = false; }
  }
}
