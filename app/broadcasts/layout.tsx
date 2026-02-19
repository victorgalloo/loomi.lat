import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getWhatsAppAccounts } from "@/lib/tenant/context";
import DashboardLayoutClient from "@/app/dashboard/DashboardLayoutClient";

export default async function BroadcastsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const userRole = await getUserRole(user.email);
  if (userRole !== "tenant") {
    redirect("/login");
  }

  const tenantId = await getTenantIdForUser(user.email);
  let isConnected = false;
  let tenantName: string | undefined;

  if (tenantId) {
    const whatsappAccounts = await getWhatsAppAccounts(tenantId);
    isConnected = whatsappAccounts.some(a => a.status === 'active');

    const supabaseTenant = await supabase
      .from('tenants')
      .select('company_name')
      .eq('id', tenantId)
      .single();
    tenantName = supabaseTenant.data?.company_name || undefined;
  }

  return (
    <DashboardLayoutClient
      userName={user.email}
      tenantName={tenantName}
      isConnected={isConnected}
    >
      {children}
    </DashboardLayoutClient>
  );
}
