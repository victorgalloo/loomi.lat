import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { upsertIntegration, getStripeCredentials } from '@/lib/integrations/tenant-integrations';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const accountId = searchParams.get('account_id');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(new URL('/login', appUrl));
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId || !accountId) {
    return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?stripe=error`);
  }

  const credentials = await getStripeCredentials(tenantId);
  if (!credentials) {
    return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?stripe=error&message=no_credentials`);
  }

  const stripe = new Stripe(credentials.secretKey);

  try {
    // Verify account status
    const account = await stripe.accounts.retrieve(accountId);
    const isComplete = account.charges_enabled && account.details_submitted;

    await upsertIntegration(tenantId, 'stripe_connect', {
      stripe_account_id: accountId,
      stripe_onboarding_complete: isComplete,
      status: isComplete ? 'connected' : 'pending',
      connected_at: isComplete ? new Date().toISOString() : null,
      error_message: null,
    });

    const status = isComplete ? 'connected' : 'pending';
    return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?stripe=${status}`);
  } catch (err) {
    console.error('[Stripe Connect] Callback error:', err);
    return NextResponse.redirect(`${appUrl}/dashboard/agent/tools?stripe=error`);
  }
}
