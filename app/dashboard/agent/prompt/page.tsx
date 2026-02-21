import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getAgentConfig, updateAgentConfig } from "@/lib/tenant/context";
import PromptEditorForm from "./PromptEditorForm";
import type { FewShotExample } from "@/lib/tenant/context";

export const dynamic = 'force-dynamic';

export default async function PromptEditorPage() {
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

  const agentConfig = await getAgentConfig(tenantId);

  async function savePromptConfig(formData: {
    systemPrompt?: string | null;
    fewShotExamples?: FewShotExample[];
    productsCatalog?: Record<string, unknown>;
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
    <PromptEditorForm
      initialConfig={{
        systemPrompt: agentConfig?.systemPrompt || null,
        fewShotExamples: agentConfig?.fewShotExamples || [],
        productsCatalog: agentConfig?.productsCatalog || {},
      }}
      onSave={savePromptConfig}
    />
  );
}
