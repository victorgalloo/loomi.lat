import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getClientIdForUser, getTenantIdForUser } from "@/lib/supabase/user-role";
import AdminDashboard from "@/components/portal/AdminDashboard";
import ClientDashboard from "@/components/portal/ClientDashboard";
import TenantDashboard from "@/components/dashboard/TenantDashboard";
import { getTenantById, getWhatsAppAccount } from "@/lib/tenant/context";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  // Determine user role
  const userRole = await getUserRole(user.email);

  // Handle tenant user (multi-tenant dashboard)
  if (userRole === "tenant") {
    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      redirect("/login");
    }

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      redirect("/login");
    }

    const whatsappAccount = await getWhatsAppAccount(tenantId);

    // Get stats for this tenant
    const [leadsResult, conversationsResult, messagesResult] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("conversations").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    ]);

    // Get appointments separately since they need to join with leads
    const { data: tenantLeadIds } = await supabase
      .from("leads")
      .select("id")
      .eq("tenant_id", tenantId);

    const leadIds = tenantLeadIds?.map(l => l.id) || [];
    const appointmentsResult = leadIds.length > 0
      ? await supabase.from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("status", "scheduled")
          .in("lead_id", leadIds)
      : { count: 0 };

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
          connected: whatsappAccount?.status === 'active',
          phoneNumber: whatsappAccount?.displayPhoneNumber || undefined,
          businessName: whatsappAccount?.businessName || undefined
        }}
        stats={{
          totalLeads: leadsResult.count || 0,
          totalConversations: conversationsResult.count || 0,
          messagesThisMonth: messagesResult.count || 0,
          appointmentsBooked: appointmentsResult.count || 0
        }}
      />
    );
  }

  // Handle client user (old portal)
  let clientData = null;
  if (userRole === "client") {
    const clientId = await getClientIdForUser(user.email);
    if (clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (client) {
        clientData = client;
      }
    }
  }

  // Handle admin user
  let allClients: Array<{ id: string; name: string; created_at: string; process_status: string | null }> = [];
  if (userRole === "admin") {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, created_at, process_status")
      .order("created_at", { ascending: false });
    allClients = clients || [];
  }

  return (
    <>
      {userRole === "admin" ? (
        <AdminDashboard clients={allClients} />
      ) : (
        <ClientDashboard client={clientData} />
      )}
    </>
  );
}
