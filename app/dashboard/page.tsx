import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getClientIdForUser } from "@/lib/supabase/user-role";
import AdminDashboard from "@/components/portal/AdminDashboard";
import ClientDashboard from "@/components/portal/ClientDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  // Determine user role
  const userRole = await getUserRole(user.email);
  
  // If client, get their client data
  let clientData = null;
  if (userRole === "client") {
    const clientId = await getClientIdForUser(user.email);
    if (clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      
      if (client) {
        clientData = client;
      }
    }
  }

  // Get all clients for admin
  let allClients: Array<{ id: string; name: string; created_at: string; process_status: string | null }> = [];
  if (userRole === "admin") {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, created_at, process_status")
      .order("created_at", { ascending: false });
    allClients = clients || [];
  }

  return (
    <>
      {userRole === "admin" ? (
        <AdminDashboard clients={allClients} />
      ) : (
        <ClientDashboard client={clientData} />
      )}
    </>
  );
}
