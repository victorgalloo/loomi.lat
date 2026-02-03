import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { trackCustomerWon } from '@/lib/integrations/meta-conversions';

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

// Mapeo de Price IDs a nombres de plan
function getPlanFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER!]: 'starter',
    [process.env.STRIPE_PRICE_GROWTH!]: 'growth',
    [process.env.STRIPE_PRICE_BUSINESS!]: 'business',
  };
  return priceMap[priceId] || 'none';
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Webhook] Signature verification failed: ${message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Webhook] Error processing ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}

/**
 * Maneja checkout.session.completed
 * Se dispara cuando el cliente completa el pago en Checkout
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const accountId = session.metadata?.accountId;
  const plan = session.metadata?.plan;
  const customerEmail = session.customer_email || session.metadata?.email;
  const customerPhone = session.metadata?.phone;

  console.log(`[Webhook] Checkout completed for customer ${customerId}`);

  if (!accountId) {
    // Buscar cuenta por stripe_customer_id
    const { data: account } = await getSupabase()
      .from('accounts')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (account) {
      await getSupabase()
        .from('accounts')
        .update({
          stripe_subscription_id: subscriptionId,
          plan: plan || 'starter',
          status: 'active',
        })
        .eq('id', account.id);
    }
  } else {
    await getSupabase()
      .from('accounts')
      .update({
        stripe_subscription_id: subscriptionId,
        plan: plan || 'starter',
        status: 'active',
      })
      .eq('id', accountId);
  }

  console.log(`[Webhook] Account activated with plan: ${plan}`);

  // Track conversion event for Meta (Purchase)
  if (customerPhone) {
    const planPrices: Record<string, number> = {
      starter: 199,
      growth: 349,
      business: 599
    };
    const value = planPrices[plan || 'starter'] || 199;

    trackCustomerWon({
      phone: customerPhone,
      email: customerEmail || undefined,
      value,
      currency: 'MXN'
    }).catch((err) => {
      console.error('[Meta] Failed to track customer won:', err);
    });
  }
}

/**
 * Maneja customer.subscription.updated
 * Se dispara cuando cambia el estado de la suscripción
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodEnd = new Date((subscription.current_period_end || Date.now() / 1000) * 1000);

  // Obtener el plan del price
  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? getPlanFromPriceId(priceId) : 'none';

  // Mapear status de Stripe a nuestro status
  let accountStatus: string;
  switch (status) {
    case 'active':
      accountStatus = 'active';
      break;
    case 'past_due':
      accountStatus = 'past_due';
      break;
    case 'canceled':
    case 'unpaid':
      accountStatus = 'canceled';
      break;
    default:
      accountStatus = 'pending';
  }

  console.log(`[Webhook] Subscription ${subscriptionId} updated: ${status} -> ${accountStatus}`);

  await getSupabase()
    .from('accounts')
    .update({
      stripe_subscription_id: subscriptionId,
      plan,
      status: accountStatus,
      current_period_end: currentPeriodEnd.toISOString(),
    })
    .eq('stripe_customer_id', customerId);
}

/**
 * Maneja customer.subscription.deleted
 * Se dispara cuando se cancela definitivamente la suscripción
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  console.log(`[Webhook] Subscription deleted for customer ${customerId}`);

  await getSupabase()
    .from('accounts')
    .update({
      status: 'canceled',
      plan: 'none',
    })
    .eq('stripe_customer_id', customerId);
}

/**
 * Maneja invoice.payment_failed
 * Se dispara cuando falla un cobro (renovación fallida)
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  console.log(`[Webhook] Payment failed for customer ${customerId}`);

  // Actualizar status a past_due
  await getSupabase()
    .from('accounts')
    .update({ status: 'past_due' })
    .eq('stripe_customer_id', customerId);

  // Opcionalmente, notificar por WhatsApp
  const { data: account } = await getSupabase()
    .from('accounts')
    .select('phone')
    .eq('stripe_customer_id', customerId)
    .single();

  if (account?.phone) {
    // Importar dinámicamente para evitar circular deps
    const { sendWhatsAppMessage } = await import('@/lib/whatsapp/send');
    await sendWhatsAppMessage(
      account.phone,
      'Hola, tuvimos un problema procesando tu pago. Por favor actualiza tu método de pago para mantener tu servicio activo.'
    );
  }
}

/**
 * Maneja invoice.payment_succeeded
 * Se dispara cuando un cobro es exitoso (útil para renovaciones)
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  console.log(`[Webhook] Payment succeeded for customer ${customerId}`);

  // Asegurar que el status sea active
  await getSupabase()
    .from('accounts')
    .update({ status: 'active' })
    .eq('stripe_customer_id', customerId);
}

// GET para verificar que el endpoint está activo
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'stripe/webhook',
    message: 'Webhook endpoint ready to receive Stripe events',
  });
}
