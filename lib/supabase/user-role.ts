import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "client";

/**
 * Determines if a user is an admin or a client
 * Admin: user email is not linked to any client via auth_email
 * Client: user email is linked to a client via auth_email
 */
export async function getUserRole(userEmail: string): Promise<UserRole> {
  const supabase = await createClient();

  // Check if user email is linked to any client
  const { data, error } = await supabase
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
  return data ? "client" : "admin";
}

/**
 * Gets the client ID for a user if they are a client
 * Returns null if user is an admin
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

