import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import type { SubscriptionPlan } from '@/types';

// Lazy initialization to avoid build-time errors
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripe;
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
  }
  return redis;
}

// Generar código corto aleatorio
function generateShortCode(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Crear URL corta para pago
async function createShortPaymentUrl(stripeUrl: string): Promise<string> {
  const code = generateShortCode();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://loomi-insurtech-5cna.vercel.app';

  // Guardar en Redis por 24 horas
  await getRedis().set(`pay:${code}`, stripeUrl, { ex: 86400 });

  return `${baseUrl}/pay/${code}`;
}

// Mapeo de planes a Price IDs de Stripe (lazy evaluated)
function getPriceIds(): Record<'starter' | 'growth' | 'business', string> {
  return {
    starter: process.env.STRIPE_PRICE_STARTER!,
    growth: process.env.STRIPE_PRICE_GROWTH!,
    business: process.env.STRIPE_PRICE_BUSINESS!,
  };
}

// Nombres legibles de los planes
const PLAN_NAMES: Record<'starter' | 'growth' | 'business', string> = {
  starter: 'Starter ($199 USD/mes)',
  growth: 'Growth ($349 USD/mes)',
  business: 'Business ($599 USD/mes)',
};

interface CreateCheckoutParams {
  email: string;
  phone?: string;
  plan: 'starter' | 'growth' | 'business';
  leadId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Crea o recupera un cliente de Stripe y genera un Checkout Session
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<{
  url: string;
  shortUrl: string;
  sessionId: string;
  accountId: string;
}> {
  const { email, phone, plan, leadId, successUrl, cancelUrl } = params;
  const supabase = getSupabase();

  // 1. Buscar si ya existe una cuenta con este email
  const { data: existingAccount } = await supabase
    .from('accounts')
    .select('*')
    .eq('email', email)
    .single();

  let stripeCustomerId: string;
  let accountId: string;

  if (existingAccount?.stripe_customer_id) {
    // Ya existe cliente en Stripe
    stripeCustomerId = existingAccount.stripe_customer_id;
    accountId = existingAccount.id;
    console.log(`[Stripe] Using existing customer: ${stripeCustomerId}`);
  } else {
    // Crear nuevo cliente en Stripe
    const customer = await getStripe().customers.create({
      email,
      phone: phone || undefined,
      metadata: {
        leadId: leadId || '',
        source: 'whatsapp_bot',
      },
    });
    stripeCustomerId = customer.id;
    console.log(`[Stripe] Created new customer: ${stripeCustomerId}`);

    // Crear o actualizar cuenta en Supabase
    if (existingAccount) {
      // Actualizar cuenta existente con Stripe customer ID
      await supabase
        .from('accounts')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', existingAccount.id);
      accountId = existingAccount.id;
    } else {
      // Crear nueva cuenta
      const { data: newAccount, error } = await supabase
        .from('accounts')
        .insert({
          email,
          phone: phone || null,
          stripe_customer_id: stripeCustomerId,
          plan: 'none',
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('[Stripe] Error creating account:', error);
        throw new Error('Error creating account');
      }
      accountId = newAccount.id;
    }

    // Vincular lead a la cuenta si existe
    if (leadId) {
      await supabase
        .from('leads')
        .update({ account_id: accountId })
        .eq('id', leadId);
    }
  }

  // 2. Crear Checkout Session
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.vercel.app';

  const session = await getStripe().checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: getPriceIds()[plan],
        quantity: 1,
      },
    ],
    success_url: successUrl || `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${baseUrl}/cancel`,
    metadata: {
      accountId,
      plan,
      leadId: leadId || '',
    },
    subscription_data: {
      metadata: {
        accountId,
        plan,
      },
    },
    // Locale en español
    locale: 'es',
  });

  console.log(`[Stripe] Checkout session created: ${session.id} for plan ${plan}`);

  // Crear URL corta
  const shortUrl = await createShortPaymentUrl(session.url!);

  return {
    url: session.url!,
    shortUrl,
    sessionId: session.id,
    accountId,
  };
}

/**
 * Helper para crear un link de checkout y obtener solo la URL
 */
export async function createCheckoutLink(
  email: string,
  phone: string,
  plan: 'starter' | 'growth' | 'business'
): Promise<string> {
  const { url } = await createCheckoutSession({ email, phone, plan });
  return url;
}

/**
 * Obtiene el nombre legible del plan
 */
export function getPlanDisplayName(plan: 'starter' | 'growth' | 'business'): string {
  return PLAN_NAMES[plan];
}

/**
 * Cancela una suscripción al final del periodo
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    console.log(`[Stripe] Subscription ${subscriptionId} set to cancel at period end`);
    return true;
  } catch (error) {
    console.error('[Stripe] Error canceling subscription:', error);
    return false;
  }
}

/**
 * Obtiene detalles de una suscripción
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    return await getStripe().subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('[Stripe] Error retrieving subscription:', error);
    return null;
  }
}

/**
 * Crea un portal de facturación para que el cliente gestione su suscripción
 */
export async function createBillingPortalSession(
  stripeCustomerId: string,
  returnUrl?: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.vercel.app';

  const session = await getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl || `${baseUrl}/dashboard`,
  });

  return session.url;
}
