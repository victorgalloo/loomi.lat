import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import Link from "next/link";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  // Only allow tenant users
  const userRole = await getUserRole(user.email);
  if (userRole !== "tenant") {
    redirect("/dashboard");
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    redirect("/login");
  }

  // Get start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Fetch analytics data
  const [
    totalLeadsResult,
    newLeadsResult,
    conversationsResult,
    messagesResult,
    appointmentsResult,
    qualifiedResult,
    stageResult
  ] = await Promise.all([
    // Total leads
    supabase.from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),

    // New leads this month
    supabase.from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", startOfMonth.toISOString()),

    // Total conversations
    supabase.from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),

    // Messages this month
    supabase.from("messages")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", startOfMonth.toISOString()),

    // Appointments booked
    supabase.from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled"),

    // Qualified leads
    supabase.from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_qualified", true),

    // Stage breakdown
    supabase.from("leads")
      .select("stage")
      .eq("tenant_id", tenantId)
  ]);

  // Calculate stage breakdown
  const stageBreakdown: Record<string, number> = {};
  (stageResult.data || []).forEach((lead) => {
    const stage = lead.stage || 'initial';
    stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
  });

  // Calculate response rate (simplified: leads with more than 1 conversation / total leads)
  const responseRate = totalLeadsResult.count && totalLeadsResult.count > 0
    ? Math.round((conversationsResult.count || 0) / totalLeadsResult.count * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Analiticas</h1>
        <p className="text-gray-600 mt-1">
          Metricas de rendimiento de tu agente AI.
        </p>
      </div>

      {/* Analytics Cards */}
      <AnalyticsCards
        data={{
          totalLeads: totalLeadsResult.count || 0,
          newLeadsThisMonth: newLeadsResult.count || 0,
          totalConversations: conversationsResult.count || 0,
          messagesThisMonth: messagesResult.count || 0,
          appointmentsBooked: appointmentsResult.count || 0,
          qualifiedLeads: qualifiedResult.count || 0,
          responseRate: Math.min(responseRate, 100),
          stageBreakdown
        }}
      />

      {/* Coming Soon */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Mas analiticas proximamente</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Estamos trabajando en graficas de tendencias, analisis de sentimiento, y reportes exportables.
        </p>
      </div>
    </div>
  );
}
