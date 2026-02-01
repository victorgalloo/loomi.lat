import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getClientIdForUser, getTenantIdForUser } from "@/lib/supabase/user-role";
import PortalLayout from "@/components/portal/PortalLayout";
import { getWhatsAppAccount } from "@/lib/tenant/context";
import DashboardLayoutClient from "./DashboardLayoutClient";

export default async function DashboardLayout({
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

  // Tenant users get the new tech dashboard
  if (userRole === "tenant") {
    const tenantId = await getTenantIdForUser(user.email);
    let isConnected = false;

    if (tenantId) {
      const whatsappAccount = await getWhatsAppAccount(tenantId);
      isConnected = whatsappAccount?.status === 'active';
    }

    return (
      <DashboardLayoutClient
        userName={user.email}
        isConnected={isConnected}
      >
        {children}
      </DashboardLayoutClient>
    );
  }

  // Admin and client users get the old portal layout
  let clientName: string | undefined;
  if (userRole === "client") {
    const clientId = await getClientIdForUser(user.email);
    if (clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("name")
        .eq("id", clientId)
        .single();
      clientName = client?.name;
    }
  }

  return (
    <PortalLayout
      userRole={userRole}
      userName={user.email}
      clientName={clientName}
    >
      {children}
    </PortalLayout>
  );
}
