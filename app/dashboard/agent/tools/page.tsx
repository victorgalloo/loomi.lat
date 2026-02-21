import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getIntegrations } from "@/lib/integrations/tenant-integrations";
import IntegrationsView from "./IntegrationsView";

export const dynamic = 'force-dynamic';

export default async function ToolsPage() {
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

  const integrations = await getIntegrations(tenantId);

  return <IntegrationsView tenantId={tenantId} integrations={integrations} />;
}
