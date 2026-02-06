import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getWhatsAppAccounts } from "@/lib/tenant/context";
import ConnectView from "./ConnectView";

export default async function ConnectPage() {
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
    redirect("/dashboard");
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    redirect("/login");
  }

  const whatsappAccounts = await getWhatsAppAccounts(tenantId);
  const activeAccounts = whatsappAccounts.filter(a => a.status === 'active');

  return (
    <ConnectView
      isConnected={activeAccounts.length > 0}
      whatsappAccounts={activeAccounts.map(a => ({
        phoneNumberId: a.phoneNumberId,
        displayPhoneNumber: a.displayPhoneNumber,
        businessName: a.businessName,
        wabaId: a.wabaId,
        connectedAt: a.connectedAt?.toISOString() || null,
      }))}
    />
  );
}
