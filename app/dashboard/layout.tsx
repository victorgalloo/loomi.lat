import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getClientIdForUser } from "@/lib/supabase/user-role";
import PortalLayout from "@/components/portal/PortalLayout";

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
  
  // Get client name if user is a client
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


