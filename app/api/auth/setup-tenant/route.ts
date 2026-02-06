/**
 * /api/auth/setup-tenant
 * Creates tenant if needed, returns state for smart redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateTenant, getWhatsAppAccounts } from '@/lib/tenant/context';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name || user.user_metadata?.name || user.email;

    // Get or create tenant
    const tenant = await getOrCreateTenant(user.email, name);
    const isNew = (Date.now() - tenant.createdAt.getTime()) < 10000; // created in last 10s

    // Check WhatsApp connection
    const waAccounts = await getWhatsAppAccounts(tenant.id);
    const hasWhatsApp = waAccounts.some(a => a.status === 'active');

    // Check onboarding status
    const { data: tenantRow } = await supabase
      .from('tenants')
      .select('onboarding_status')
      .eq('id', tenant.id)
      .single();

    const onboardingComplete = tenantRow?.onboarding_status?.currentStep === 'complete';

    return NextResponse.json({
      tenantId: tenant.id,
      isNew,
      hasWhatsApp,
      onboardingComplete,
    });
  } catch (error) {
    console.error('[SetupTenant] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
