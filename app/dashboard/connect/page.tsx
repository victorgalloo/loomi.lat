import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getWhatsAppAccount } from "@/lib/tenant/context";
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

  const whatsappAccount = await getWhatsAppAccount(tenantId);
  const isConnected = whatsappAccount?.status === 'active';

  return (
    <ConnectView
      isConnected={isConnected}
      whatsappAccount={whatsappAccount ? {
        displayPhoneNumber: whatsappAccount.displayPhoneNumber,
        businessName: whatsappAccount.businessName,
        wabaId: whatsappAccount.wabaId,
        connectedAt: whatsappAccount.connectedAt?.toISOString() || null,
      } : null}
    />
  );
}
