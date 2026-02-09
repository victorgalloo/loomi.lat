import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getAgentConfig, updateAgentConfig, AgentConfig } from "@/lib/tenant/context";
import AgentSetupWizard from "./AgentSetupWizard";

export default async function AgentSetupPage() {
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

  async function saveAgentSetup(config: Partial<Omit<AgentConfig, 'id' | 'tenantId'>>) {
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

    await updateAgentConfig(tenantId, config);
  }

  return (
    <AgentSetupWizard
      existingConfig={agentConfig}
      onSave={saveAgentSetup}
    />
  );
}
