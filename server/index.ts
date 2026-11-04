import express from 'express';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { PaymentError, PaymentService, quote, fingerprint, type RecordState } from './payment.js';
import { PayPal } from './paypal.js';
import { inquiryRouter } from './inquiry-routes.js';

if (process.env.PAYPAL_ENVIRONMENT && process.env.PAYPAL_ENVIRONMENT !== 'sandbox') throw new Error('Sandbox only.');
const app = express();
app.disable('x-powered-by');
app.use('/api/inquiries', express.json({limit: '12kb'}));
app.use(express.json({limit: '4kb'}));
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (req.method === 'POST' && (req.get('sec-fetch-site') === 'cross-site' || !req.is('application/json') ||
    (req.get('origin') && req.get('origin') !== `http://${req.get('host')}`))) {
    res.status(403).json({message: 'Use the local checkout page.'}); return;
  }
  next();
});
const file = resolve('local-data/purchase.json');
mkdirSync(resolve('local-data'), {recursive: true});
let state: RecordState | undefined = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined;
const paypal = new PayPal(process.env.PAYPAL_CLIENT_ID ?? '', process.env.PAYPAL_CLIENT_SECRET ?? '');
const service = new PaymentService({get: () => state, save: r => {
  writeFileSync(`${file}.tmp`, JSON.stringify(r), {mode: 0o600}); renameSync(`${file}.tmp`, file); state = r;
}}, paypal);
app.get('/api/quote', (_req, res) => res.json({...quote, fingerprint: fingerprint(quote)}));
app.get('/api/config', (_req, res) => res.json({clientId: process.env.PAYPAL_CLIENT_ID ?? '', configured: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)}));
app.get('/api/purchase', (_req, res) => res.json(service.status()));
app.post('/api/orders', async (req, res) => res.json(await service.create(req.body.fingerprint, req.body.accepted)));
app.post('/api/orders/:id/capture', async (req, res) => res.json(await service.capture(req.params.id)));
app.use('/api/inquiries', inquiryRouter(paypal,()=>state?.orderId?[state.orderId]:[]));
app.use('/api', (_req, res) => res.status(404).json({message: 'Unknown checkout endpoint.'}));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(resolve('dist')));
  app.get('/', (_req, res) => res.sendFile(resolve('dist/index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({server: {middlewareMode: true}, appType: 'spa'});
  app.use(vite.middlewares);
}
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err instanceof PaymentError ? err.code : 500).json({message: err instanceof PaymentError ? err.message : 'Checkout could not complete. Check purchase status before paying again.'});
});
const port=Number(process.env.PORT ?? 3000);
app.listen(port, '127.0.0.1', (error?:Error) => {
  if(error){console.error(`Chloro could not start on port ${port}. Stop the older app process before restarting. No payment data was reset.`);process.exitCode=1;return;}
  console.log(`Chloro sandbox checkout: http://localhost:${port}`);
});
