import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import AnalyticsView from "./AnalyticsView";

export const dynamic = 'force-dynamic';

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
    stageResult,
    wonLeadsResult,
    demoLeadsResult,
    capiEventsResult,
    capiAllResult,
    windowStandardResult,
    windowCtwaResult,
    windowMessagesResult
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
      .eq("tenant_id", tenantId),

    // Won leads with deal values
    supabase.from("leads")
      .select("id, deal_value")
      .eq("tenant_id", tenantId)
      .eq("stage", "Ganado"),

    // Demo leads (Hot stage or Demo Agendada)
    supabase.from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("stage", ["Hot", "Demo Agendada"]),

    // CAPI recent events (last 10)
    supabase.from("conversion_events_queue")
      .select("id, event_name, phone, status, created_at, sent_at, last_error")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10),

    // CAPI all events for status counts
    supabase.from("conversion_events_queue")
      .select("status")
      .eq("tenant_id", tenantId),

    // Service window: active standard windows (24h)
    supabase.from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("service_window_type", "standard")
      .gte("service_window_start", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

    // Service window: active CTWA windows (72h)
    supabase.from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("service_window_type", "ctwa")
      .gte("service_window_start", new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()),

    // Messages this month with window tag
    supabase.from("messages")
      .select("in_service_window")
      .eq("tenant_id", tenantId)
      .eq("role", "assistant")
      .not("in_service_window", "is", null)
      .gte("created_at", startOfMonth.toISOString())
  ]);

  // Calculate stage breakdown
  const stageBreakdown: Record<string, number> = {};
  (stageResult.data || []).forEach((lead) => {
    const stage = lead.stage || 'Nuevo';
    stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
  });

  // Calculate response rate
  const responseRate = totalLeadsResult.count && totalLeadsResult.count > 0
    ? Math.round((conversationsResult.count || 0) / totalLeadsResult.count * 100)
    : 0;

  // Funnel data
  const wonLeads = wonLeadsResult.data || [];
  const wonCount = wonLeads.length;
  const totalDealValue = wonLeads.reduce((sum, l) => sum + (l.deal_value || 0), 0);
  const demoCount = (demoLeadsResult.count || 0) + wonCount; // demos include won

  // CAPI status counts
  const capiStatuses = capiAllResult.data || [];
  const capiCounts = { sent: 0, pending: 0, failed: 0 };
  capiStatuses.forEach((e) => {
    if (e.status === 'sent') capiCounts.sent++;
    else if (e.status === 'pending') capiCounts.pending++;
    else if (e.status === 'failed') capiCounts.failed++;
  });

  // Service window metrics
  const windowMessages = windowMessagesResult.data || [];
  let windowFree = 0;
  let windowPaid = 0;
  windowMessages.forEach((m) => {
    if (m.in_service_window === true) windowFree++;
    else windowPaid++;
  });

  return (
    <AnalyticsView
      data={{
        totalLeads: totalLeadsResult.count || 0,
        newLeadsThisMonth: newLeadsResult.count || 0,
        totalConversations: conversationsResult.count || 0,
        messagesThisMonth: messagesResult.count || 0,
        appointmentsBooked: appointmentsResult.count || 0,
        qualifiedLeads: qualifiedResult.count || 0,
        responseRate: Math.min(responseRate, 100),
        stageBreakdown,
        funnel: {
          total: totalLeadsResult.count || 0,
          qualified: qualifiedResult.count || 0,
          demo: demoCount,
          won: wonCount,
          totalDealValue
        },
        capi: {
          counts: capiCounts,
          events: (capiEventsResult.data || []).map((e) => ({
            id: e.id,
            eventName: e.event_name,
            phone: e.phone,
            status: e.status,
            createdAt: e.created_at,
            lastError: e.last_error
          }))
        },
        serviceWindow: {
          activeStandard: windowStandardResult.count || 0,
          activeCtwa: windowCtwaResult.count || 0,
          freeMessages: windowFree,
          paidMessages: windowPaid,
        }
      }}
    />
  );
}
