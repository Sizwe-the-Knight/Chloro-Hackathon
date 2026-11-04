export const PAYMENT_CURRENCIES=['USD','EUR','GBP'];
export type PaymentView = {
  status: string; orderId?: string; captureId?: string;
  collection: 'NOT_PAID' | 'AWAITING_READY' | 'READY' | 'HANDOVER_RECORDED';
  merchantReady: boolean; travelerHandover: boolean; merchantHandover: boolean;
};
