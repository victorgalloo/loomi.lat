import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getAgentConfig, updateAgentConfig } from "@/lib/tenant/context";
import AgentConfigForm from "@/components/dashboard/AgentConfigForm";
import Link from "next/link";

export default async function AgentConfigPage() {
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

  const agentConfig = await getAgentConfig(tenantId);

  // Server action to save config
  async function saveConfig(formData: {
    businessName?: string | null;
    businessDescription?: string | null;
    productsServices?: string | null;
    tone?: 'professional' | 'friendly' | 'casual' | 'formal';
    customInstructions?: string | null;
    autoReplyEnabled?: boolean;
    greetingMessage?: string | null;
    fallbackMessage?: string | null;
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
    <div className="max-w-3xl mx-auto space-y-8">
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
        <h1 className="text-2xl font-bold text-gray-900">Configurar Agente AI</h1>
        <p className="text-gray-600 mt-1">
          Personaliza como tu agente responde a los clientes.
        </p>
      </div>

      <AgentConfigForm
        initialConfig={{
          businessName: agentConfig?.businessName || null,
          businessDescription: agentConfig?.businessDescription || null,
          productsServices: agentConfig?.productsServices || null,
          tone: agentConfig?.tone || 'professional',
          customInstructions: agentConfig?.customInstructions || null,
          autoReplyEnabled: agentConfig?.autoReplyEnabled ?? true,
          greetingMessage: agentConfig?.greetingMessage || null,
          fallbackMessage: agentConfig?.fallbackMessage || null,
        }}
        onSave={saveConfig}
      />
    </div>
  );
}
