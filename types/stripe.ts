// Stripe Subscriptions Types

export type SubscriptionPlan = 'none' | 'starter' | 'growth' | 'business';
export type AccountStatus = 'pending' | 'active' | 'canceled' | 'past_due';

export interface Account {
  id: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  email: string;
  phone?: string;
  companyName?: string;
  plan: SubscriptionPlan;
  status: AccountStatus;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutSessionRequest {
  email: string;
  phone?: string;
  plan: 'starter' | 'growth' | 'business';
  leadId?: string;
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}
