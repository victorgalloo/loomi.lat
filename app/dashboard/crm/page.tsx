import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import CRMView from "./CRMView";

export const dynamic = 'force-dynamic';

export default async function CRMPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const userRole = await getUserRole(user.email);
  if (userRole !== "tenant") {
    redirect("/dashboard");
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    redirect("/login");
  }

  // Fetch pipeline stages
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("position");

  const pipelineStages = stages && stages.length > 0
    ? stages.map(s => ({
        id: s.id,
        name: s.name,
        color: s.color,
        position: s.position,
        isWon: s.is_won,
        isLost: s.is_lost,
      }))
    : [
        { id: '1', name: 'Cold', color: 'blue', position: 0, isWon: false, isLost: false },
        { id: '2', name: 'Warm', color: 'amber', position: 1, isWon: false, isLost: false },
        { id: '3', name: 'Hot', color: 'orange', position: 2, isWon: false, isLost: false },
        { id: '4', name: 'Ganado', color: 'emerald', position: 3, isWon: true, isLost: false },
        { id: '5', name: 'Perdido', color: 'gray', position: 4, isWon: false, isLost: true },
      ];

  // Fetch leads
  const { data: leads } = await supabase
    .from("leads")
    .select(`
      id,
      name,
      phone,
      company_name,
      contact_email,
      deal_value,
      stage,
      priority,
      last_activity_at,
      broadcast_classification,
      conversations(count)
    `)
    .eq("tenant_id", tenantId)
    .order("last_activity_at", { ascending: false });

  const formattedLeads = (leads || []).map(lead => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    companyName: lead.company_name,
    contactEmail: lead.contact_email,
    dealValue: lead.deal_value,
    stage: lead.stage || 'Cold',
    priority: (lead.priority || 'medium') as 'low' | 'medium' | 'high',
    lastActivityAt: lead.last_activity_at,
    broadcastClassification: lead.broadcast_classification,
    conversationCount: lead.conversations?.[0]?.count || 0,
  }));

  return (
    <CRMView
      stages={pipelineStages}
      leads={formattedLeads}
      tenantId={tenantId}
    />
  );
}
