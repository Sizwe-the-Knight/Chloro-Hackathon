import { PaymentError, type Gateway } from './payment.js';

const base = 'https://api-m.sandbox.paypal.com'; // No configurable live endpoint.
export class PayPal implements Gateway {
  constructor(private clientId: string, private secret: string) {}
  private async call(path: string, body: unknown, key: string) {
    if (!this.clientId || !this.secret) throw new PaymentError('Sandbox credentials are not configured locally.', 503);
    const auth = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST', headers: {Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'grant_type=client_credentials', signal: AbortSignal.timeout(15000)
    });
    if (!auth.ok) throw new PaymentError('PayPal sandbox authentication failed. Check local credentials.', 502);
    const token = await auth.json() as {access_token: string};
    const response = await fetch(`${base}${path}`, {method: 'POST', headers: {
      Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': key, Prefer: 'return=representation'
    }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw new PaymentError('PayPal sandbox request failed or was declined. Check the existing order before another payment.', 502);
    return response.json();
  }
  create(body: unknown, key: string) { return this.call('/v2/checkout/orders', body, key); }
  capture(id: string, key: string) { return this.call(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`, {}, key); }
}
