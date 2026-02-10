import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import TenantDashboard from "@/components/dashboard/TenantDashboard";
import { getTenantById, getWhatsAppAccounts, getOrCreateTenant } from "@/lib/tenant/context";
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  // Determine user role
  let userRole = await getUserRole(user.email);

  // For new users (role "admin" but not a partner), auto-create tenant
  if (userRole === "admin") {
    await getOrCreateTenant(user.email, user.user_metadata?.name);
    userRole = "tenant";
  }

  // Handle tenant user (multi-tenant dashboard)
  if (userRole === "tenant") {
    let tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      const tenant = await getOrCreateTenant(user.email, user.user_metadata?.name);
      tenantId = tenant.id;
    }

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      redirect("/login");
    }

    const whatsappAccounts = await getWhatsAppAccounts(tenantId);
    const primaryAccount = whatsappAccounts.find(a => a.status === 'active') || whatsappAccounts[0] || null;

    // Get stats for this tenant
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const [leadsResult, activeConversationsResult, warmLeadsResult, hotLeadsResult] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("conversations").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("updated_at", last24h),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("broadcast_classification", "warm"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("broadcast_classification", "hot"),
    ]);

    return (
      <TenantDashboard
        tenant={{
          name: tenant.name,
          email: tenant.email,
          companyName: tenant.companyName,
          subscriptionTier: tenant.subscriptionTier,
          subscriptionStatus: tenant.subscriptionStatus
        }}
        whatsappAccount={{
          connected: primaryAccount?.status === 'active',
          phoneNumber: primaryAccount?.displayPhoneNumber || undefined,
          businessName: primaryAccount?.businessName || undefined
        }}
        stats={{
          totalLeads: leadsResult.count || 0,
          activeConversations: activeConversationsResult.count || 0,
          warmLeads: warmLeadsResult.count || 0,
          hotLeads: hotLeadsResult.count || 0,
        }}
        tenantId={tenantId}
      />
    );
  }

  // Non-tenant users without partner access get redirected to login
  redirect("/login");
}
