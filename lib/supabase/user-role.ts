import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "client" | "tenant";
export type MemberRole = "owner" | "admin" | "member";

/**
 * Determines if a user is an admin, client, or tenant
 * Tenant: user email is linked to a tenant via tenants.email OR tenant_members
 * Client: user email is linked to a client via auth_email in clients table
 * Admin: user email is not linked to any client or tenant
 */
export async function getUserRole(userEmail: string): Promise<UserRole> {
  const supabase = await createClient();

  // Check tenant_members first (covers both owners and invited members)
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("email", userEmail)
    .limit(1)
    .single();

  if (membership) {
    return "tenant";
  }

  // Fallback: check tenants.email directly (in case backfill hasn't run)
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("email", userEmail)
    .single();

  if (tenant) {
    return "tenant";
  }

  // Check if user email is linked to any client (old portal system)
  const { data: client, error } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_email", userEmail)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned, which is expected for admins
    console.error("Error checking user role:", error);
    // Default to admin if there's an error
    return "admin";
  }

  // If data exists, user is a client, otherwise admin
  return client ? "client" : "admin";
}

/**
 * Gets the client ID for a user if they are a client
 * Returns null if user is an admin or tenant
 */
export async function getClientIdForUser(userEmail: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_email", userEmail)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

/**
 * Gets the tenant ID for a user if they are a tenant
 * Checks tenant_members first, then falls back to tenants.email
 * Returns null if user is not a tenant
 */
export async function getTenantIdForUser(userEmail: string): Promise<string | null> {
  const supabase = await createClient();

  // Check tenant_members first (covers owners + invited members)
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("email", userEmail)
    .limit(1)
    .single();

  if (membership) {
    return membership.tenant_id;
  }

  // Fallback: direct tenants.email lookup
  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("email", userEmail)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

/**
 * Gets the member role for a user within their tenant
 * Returns null if user has no membership record
 */
export async function getMemberRoleForUser(userEmail: string): Promise<MemberRole | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("email", userEmail)
    .limit(1)
    .single();

  if (!data) {
    return null;
  }

  return data.role as MemberRole;
}

