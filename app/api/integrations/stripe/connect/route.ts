import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { upsertIntegration, getIntegration, getStripeCredentials } from '@/lib/integrations/tenant-integrations';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  if (!user?.email) {
    return NextResponse.redirect(new URL('/login', appUrl));
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    return NextResponse.redirect(new URL('/login', appUrl));
  }

  const credentials = await getStripeCredentials(tenantId);
  if (!credentials) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/agent/tools?stripe=error&message=no_credentials`
    );
  }

  const stripe = new Stripe(credentials.secretKey);

  try {
    // Check if tenant already has a Stripe account
    const existing = await getIntegration(tenantId, 'stripe_connect');
    let accountId = existing?.stripeAccountId;

    if (!accountId) {
      // Create new Stripe Connect account
      const account = await stripe.accounts.create({ type: 'standard' });
      accountId = account.id;

      await upsertIntegration(tenantId, 'stripe_connect', {
        status: 'pending',
        stripe_account_id: accountId,
      });
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/api/integrations/stripe/connect`,
      return_url: `${appUrl}/api/integrations/stripe/callback?account_id=${accountId}`,
      type: 'account_onboarding',
    });

    return NextResponse.redirect(accountLink.url);
  } catch (err) {
    console.error('[Stripe Connect] Error:', err);
    return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?stripe=error`);
  }
}
