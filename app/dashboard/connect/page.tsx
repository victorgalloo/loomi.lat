import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getWhatsAppAccounts, getTenantById } from "@/lib/tenant/context";
import { getProvisionedNumbers } from "@/lib/twilio/numbers";
import ConnectView from "./ConnectView";

export const dynamic = 'force-dynamic';

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

  const [whatsappAccounts, twilioNumbers, tenant] = await Promise.all([
    getWhatsAppAccounts(tenantId),
    getProvisionedNumbers(tenantId).catch(() => []),
    getTenantById(tenantId),
  ]);
  const activeAccounts = whatsappAccounts.filter(a => a.status === 'active');

  // Twilio numbers not yet connected to WhatsApp
  const pendingTwilioNumbers = twilioNumbers
    .filter(n => n.status === 'active' || n.status === 'pending_whatsapp')
    .map(n => ({ id: n.id, phoneNumber: n.phoneNumber, status: n.status }));

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
      pendingTwilioNumbers={pendingTwilioNumbers}
      metaBusinessId={tenant?.metaBusinessId || null}
      tenantId={tenantId}
    />
  );
}
