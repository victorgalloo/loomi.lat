import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import Link from "next/link";
import { ArrowLeft, BarChart3, Sparkles, Clock } from "lucide-react";

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

  // Calculate response rate
  const responseRate = totalLeadsResult.count && totalLeadsResult.count > 0
    ? Math.round((conversationsResult.count || 0) / totalLeadsResult.count * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full pointer-events-none" />

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-cyan-100 border border-cyan-200 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analiticas</h1>
          </div>
        </div>
        <p className="text-gray-600 mt-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-600" />
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
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent pointer-events-none" />

        <div className="w-16 h-16 bg-purple-100 border border-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10">
          <Clock className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 relative z-10">Mas analiticas proximamente</h3>
        <p className="text-gray-600 max-w-md mx-auto relative z-10">
          Estamos trabajando en graficas de tendencias, analisis de sentimiento, y reportes exportables.
        </p>
      </div>
    </div>
  );
}
