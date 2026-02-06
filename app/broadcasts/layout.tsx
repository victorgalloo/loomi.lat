import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getWhatsAppAccount } from "@/lib/tenant/context";
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
