import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import ConversationList from "@/components/dashboard/ConversationList";
import Link from "next/link";

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
      leads!inner(id, name, phone, stage, tenant_id)
    `)
    .eq("leads.tenant_id", tenantId)
    .order("started_at", { ascending: false })
    .limit(50);

  // Get message counts and last messages
  const conversations = await Promise.all(
    (conversationsData || []).map(async (conv) => {
      const lead = conv.leads as unknown as { id: string; name: string; phone: string; stage: string };

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
        lastMessageTime: new Date(lastMessage?.created_at || conv.started_at),
        messageCount: count || 0,
        stage: lead.stage || "initial",
      };
    })
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conversaciones</h1>
            <p className="text-gray-600 mt-1">
              {conversations.length} conversaciones
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          Todas
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          Activas
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          Archivadas
        </button>
      </div>

      {/* Conversation List */}
      <ConversationList conversations={conversations} />
    </div>
  );
}
