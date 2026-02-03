import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAuthorizedPartner } from "@/lib/partners/auth";
import PartnersView from "@/components/partners/PartnersView";

export const metadata = {
  title: "Partners | Loomi",
  description: "Resumen ejecutivo para socios de Loomi",
};

export default async function PartnersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user || !user.email) {
    redirect("/login");
  }

  // Check if user is an authorized partner
  if (!isAuthorizedPartner(user.email)) {
    redirect("/login?error=unauthorized");
  }

  return <PartnersView userEmail={user.email} />;
}
