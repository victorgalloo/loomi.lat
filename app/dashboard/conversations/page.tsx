import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import ConversationsView from "./ConversationsView";

export const dynamic = 'force-dynamic';

export default async function ConversationsPage() {
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

  // Get conversations with lead info
  const { data: conversationsData } = await supabase
    .from("conversations")
    .select(`
      id,
      lead_id,
      started_at,
      ended_at,
      leads!inner(id, name, phone, stage, broadcast_classification, tenant_id)
    `)
    .eq("leads.tenant_id", tenantId)
    .order("started_at", { ascending: false })
    .limit(50);

  // Get message counts and last messages
  const conversations = await Promise.all(
    (conversationsData || []).map(async (conv) => {
      const lead = conv.leads as unknown as { id: string; name: string; phone: string; stage: string; broadcast_classification: string | null };

      const { data: messages, count } = await supabase
        .from("messages")
        .select("content, created_at", { count: "exact" })
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastMessage = messages?.[0];

      return {
        id: conv.id,
        leadId: lead.id,
        leadName: lead.name || "Usuario",
        leadPhone: lead.phone,
        lastMessage: lastMessage?.content || "Sin mensajes",
        lastMessageTime: lastMessage?.created_at || conv.started_at,
        messageCount: count || 0,
        stage: lead.stage || "initial",
        broadcastClassification: lead.broadcast_classification || undefined,
      };
    })
  );

  return <ConversationsView conversations={conversations} tenantId={tenantId} />;
}
