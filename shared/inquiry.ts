import type {MerchantId} from './merchants.js';
export type InquiryInput = {
  merchantId?: MerchantId;
  message: string; travelerLanguage: string; budget: string; currency: string; departure: string;
};
export type Interpretation = {
  item: string | null; preferences: string[]; budgetConstraint: string | null;
  deadlineConstraint: string | null; constraints: string[]; translatedRequest: string;
  travelerSummary: string; missingDetails: string[]; uncertainties: string[];
};
export type MerchantOffer = {
  description: string; amount: string; currency: string; pickupLocation: string;
  readyAt: string; collectionTerms: string; clarification: string;
};
export type Inquiry = {
  merchantId?: MerchantId;
  id: string; createdAt: string; input: InquiryInput; merchant: string; merchantLanguage: string;
  status: 'INTERPRETING' | 'AI_ERROR' | 'NEEDS_CLARIFICATION' | 'AWAITING_MERCHANT' |
    'MERCHANT_REVIEW' | 'DECLINED' | 'OFFER_APPROVED' | 'BUYER_ACCEPTED';
  interpretation?: Interpretation; error?: string; declineReason?: string;
  offer?: MerchantOffer & {version: number; merchantApproved: true}; acceptedVersion?: number;
};
