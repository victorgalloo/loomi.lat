import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getAgentConfig, updateAgentConfig } from "@/lib/tenant/context";
import AgentConfigForm from "@/components/dashboard/AgentConfigForm";
import Link from "next/link";
import { Bot, ArrowLeft, Sparkles } from "lucide-react";

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
    redirect("/loomi/dashboard");
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
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full pointer-events-none" />

        <Link
          href="/loomi/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-100 border border-purple-200 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurar Agente AI</h1>
          </div>
        </div>
        <p className="text-gray-600 mt-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
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
