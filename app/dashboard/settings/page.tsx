import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getTenantById, getWhatsAppAccounts } from "@/lib/tenant/context";
import SettingsView from "./SettingsView";

export default async function SettingsPage() {
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

  const tenant = await getTenantById(tenantId);
  const whatsappAccounts = await getWhatsAppAccounts(tenantId);

  if (!tenant) {
    redirect("/login");
  }

  const activeAccounts = whatsappAccounts.filter(a => a.status === 'active');
  const primaryAccount = activeAccounts[0] || null;

  return (
    <SettingsView
      tenant={{
        name: tenant.name,
        email: tenant.email,
        companyName: tenant.companyName,
        subscriptionTier: tenant.subscriptionTier,
        subscriptionStatus: tenant.subscriptionStatus,
        createdAt: tenant.createdAt.toISOString(),
      }}
      whatsapp={{
        connected: activeAccounts.length > 0,
        phoneNumber: primaryAccount?.displayPhoneNumber || null,
        businessName: primaryAccount?.businessName || null,
        totalNumbers: activeAccounts.length,
      }}
    />
  );
}
