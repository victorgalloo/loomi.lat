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
    const stage = lead.stage || 'Nuevo';
    stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
  });

  // Calculate response rate
  const responseRate = totalLeadsResult.count && totalLeadsResult.count > 0
    ? Math.round((conversationsResult.count || 0) / totalLeadsResult.count * 100)
    : 0;

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
        stageBreakdown
      }}
    />
  );
}
