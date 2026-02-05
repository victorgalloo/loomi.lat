import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import CampaignDetailView from "./CampaignDetailView";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Fetch campaign
  const { data: campaign } = await supabase
    .from("broadcast_campaigns")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (!campaign) {
    redirect("/dashboard/broadcasts");
  }

  // Fetch recipients
  const { data: recipients } = await supabase
    .from("broadcast_recipients")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });

  return (
    <CampaignDetailView
      campaign={campaign}
      recipients={recipients || []}
      tenantId={tenantId}
    />
  );
}
