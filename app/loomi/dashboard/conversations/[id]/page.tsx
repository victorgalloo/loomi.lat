import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import ConversationDetailView from "./ConversationDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationDetailPage({ params }: PageProps) {
  const { id } = await params;
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
    redirect("/loomi/dashboard");
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    redirect("/login");
  }

  // Get conversation with lead info
  const { data: conversation } = await supabase
    .from("conversations")
    .select(`
      id,
      started_at,
      ended_at,
      summary,
      leads!inner(id, name, phone, email, company, stage, industry, tenant_id)
    `)
    .eq("id", id)
    .single();

  if (!conversation) {
    notFound();
  }

  const lead = conversation.leads as unknown as {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    company: string | null;
    stage: string;
    industry: string | null;
    tenant_id: string;
  };

  // Verify conversation belongs to this tenant
  if (lead.tenant_id !== tenantId) {
    notFound();
  }

  // Get messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return (
    <ConversationDetailView
      conversation={{
        id: conversation.id,
        started_at: conversation.started_at,
        ended_at: conversation.ended_at,
        summary: conversation.summary,
      }}
      lead={{
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        company: lead.company,
        stage: lead.stage,
        industry: lead.industry,
      }}
      messages={messages || []}
    />
  );
}
