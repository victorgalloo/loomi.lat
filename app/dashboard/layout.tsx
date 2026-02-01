import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getClientIdForUser, getTenantIdForUser } from "@/lib/supabase/user-role";
import PortalLayout from "@/components/portal/PortalLayout";
import Sidebar from "@/components/dashboard/Sidebar";
import { getWhatsAppAccount } from "@/lib/tenant/context";

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

  // Determine user role
  const userRole = await getUserRole(user.email);

  // Tenant users get the new multi-tenant dashboard
  if (userRole === "tenant") {
    const tenantId = await getTenantIdForUser(user.email);
    let isConnected = false;

    if (tenantId) {
      const whatsappAccount = await getWhatsAppAccount(tenantId);
      isConnected = whatsappAccount?.status === 'active';
    }

    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          userName={user.email}
          isConnected={isConnected}
        />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    );
  }

  // Get client name if user is a client (old portal system)
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

  // Admin and client users get the old portal layout
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


