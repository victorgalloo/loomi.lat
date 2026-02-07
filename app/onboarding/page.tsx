import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { getOrCreateTenant, getWhatsAppAccounts } from '@/lib/tenant/context';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login');
  }

  // Try to get existing tenant, or create one if missing
  let tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    const tenant = await getOrCreateTenant(user.email, user.user_metadata?.name);
    tenantId = tenant.id;
  }

  // Check if already completed onboarding
  const { data: tenant } = await supabase
    .from('tenants')
    .select('onboarding_status')
    .eq('id', tenantId)
    .single();

  if (tenant?.onboarding_status?.currentStep === 'complete') {
    redirect('/dashboard');
  }

  // Get existing config and WhatsApp status in parallel
  const [{ data: config }, whatsappAccounts] = await Promise.all([
    supabase
      .from('agent_configs')
      .select('business_name, business_description, industry, tone')
      .eq('tenant_id', tenantId)
      .single(),
    getWhatsAppAccounts(tenantId),
  ]);

  const hasWhatsApp = whatsappAccounts.some(a => a.status === 'active');

  return (
    <OnboardingWizard
      tenantId={tenantId}
      tenantEmail={user.email}
      hasWhatsApp={hasWhatsApp}
      existingConfig={config ? {
        businessName: config.business_name || undefined,
        businessDescription: config.business_description || undefined,
        industry: config.industry || undefined,
        tone: config.tone || undefined,
      } : undefined}
    />
  );
}
