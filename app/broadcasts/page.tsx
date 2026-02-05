import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTenantIdForUser } from "@/lib/supabase/user-role";
import BroadcastsView from "./BroadcastsView";

export default async function BroadcastsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    redirect("/login");
  }

  // Fetch campaigns
  const { data: campaigns } = await supabase
    .from("broadcast_campaigns")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return <BroadcastsView campaigns={campaigns || []} tenantId={tenantId} />;
}
