import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getAgentConfig, updateAgentConfig } from "@/lib/tenant/context";
import AgentConfigForm from "./AgentConfigForm";

export default async function AgentConfigPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const userRole = await getUserRole(user.email);
  if (userRole !== "tenant") {
    redirect("/loomi/dashboard");
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    redirect("/login");
  }

  const agentConfig = await getAgentConfig(tenantId);

  async function saveConfig(formData: {
    businessName?: string | null;
    businessDescription?: string | null;
    productsServices?: string | null;
    tone?: 'professional' | 'friendly' | 'casual' | 'formal';
    customInstructions?: string | null;
    autoReplyEnabled?: boolean;
  }) {
    'use server';

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      throw new Error('Not authenticated');
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      throw new Error('Tenant not found');
    }

    await updateAgentConfig(tenantId, formData);
  }

  return (
    <AgentConfigForm
      initialConfig={{
        businessName: agentConfig?.businessName || null,
        businessDescription: agentConfig?.businessDescription || null,
        productsServices: agentConfig?.productsServices || null,
        tone: agentConfig?.tone || 'professional',
        customInstructions: agentConfig?.customInstructions || null,
        autoReplyEnabled: agentConfig?.autoReplyEnabled ?? true,
      }}
      onSave={saveConfig}
    />
  );
}
