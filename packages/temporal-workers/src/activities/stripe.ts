import Stripe from 'stripe';
import { StripePlan, CheckoutResult } from '../types';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripeClient;
}

function getPriceId(plan: StripePlan): string {
  const priceIds: Record<StripePlan, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    business: process.env.STRIPE_PRICE_BUSINESS,
  };

  const priceId = priceIds[plan];
  if (!priceId) {
    throw new Error(`STRIPE_PRICE_${plan.toUpperCase()} environment variable is required`);
  }
  return priceId;
}

export function getPlanDisplayName(plan: StripePlan): string {
  const names: Record<StripePlan, string> = {
    starter: 'Starter ($199/mes)',
    growth: 'Growth ($349/mes)',
    business: 'Business ($599/mes)',
  };
  return names[plan];
}

export async function createOrGetCustomer(
  email: string,
  phone: string,
  name?: string
): Promise<{ customerId: string; isNew: boolean }> {
  const stripe = getStripe();

  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return { customerId: existingCustomers.data[0].id, isNew: false };
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    phone,
    name: name || undefined,
    metadata: {
      source: 'loomi-temporal',
    },
  });

  return { customerId: customer.id, isNew: true };
}

export async function createCheckoutSession(params: {
  email: string;
  phone: string;
  plan: StripePlan;
  leadId: string;
  name?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<CheckoutResult> {
  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://loomi.lat';

  // Get or create customer
  const { customerId } = await createOrGetCustomer(params.email, params.phone, params.name);

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: getPriceId(params.plan),
        quantity: 1,
      },
    ],
    success_url: params.successUrl || `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl || `${baseUrl}/payment/cancel`,
    metadata: {
      leadId: params.leadId,
      plan: params.plan,
      source: 'loomi-temporal',
    },
    subscription_data: {
      metadata: {
        leadId: params.leadId,
        plan: params.plan,
      },
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  // Generate short URL code (simple hash)
  const shortCode = Buffer.from(session.id).toString('base64').slice(0, 8);
  const shortUrl = `${baseUrl}/pay/${shortCode}`;

  return {
    url: session.url,
    shortUrl,
    sessionId: session.id,
    accountId: customerId,
  };
}

export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  const stripe = getStripe();

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return null;
    }
    return customer as Stripe.Customer;
  } catch {
    return null;
  }
}

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}

export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const stripe = getStripe();

  try {
    if (immediately) {
      await stripe.subscriptions.cancel(subscriptionId);
    } else {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl?: string
): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://loomi.lat';

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${baseUrl}/dashboard/settings`,
    });
    return { url: session.url };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: message };
  }
}

// Activity exports for Temporal
export const stripeActivities = {
  createOrGetCustomer,
  createCheckoutSession,
  getCustomer,
  getSubscription,
  cancelSubscription,
  createBillingPortalSession,
  getPlanDisplayName,
};
