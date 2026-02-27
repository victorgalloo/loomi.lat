/**
 * /api/auth/setup-tenant-redirect
 * Server-side redirect after magic link auth callback.
 * Sets up tenant and redirects to dashboard or onboarding.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTenant, getWhatsAppAccounts } from "@/lib/tenant/context";
import { getSupabase } from "@/lib/memory/supabase";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      console.error("[SetupTenantRedirect] No user or email after getUser()", { userId: user?.id, email: user?.email });
      return NextResponse.redirect(`${origin}/login`);
    }

    console.log("[SetupTenantRedirect] User authenticated:", user.email);

    const name = user.user_metadata?.name || user.email;
    const tenant = await getOrCreateTenant(user.email, name);

    // Mark joined_at for invited members on first login
    const db = getSupabase();
    await db
      .from("tenant_members")
      .update({ joined_at: new Date().toISOString() })
      .eq("email", user.email)
      .eq("tenant_id", tenant.id)
      .is("joined_at", null);

    // Check onboarding status
    const { data: tenantRow } = await supabase
      .from("tenants")
      .select("onboarding_status")
      .eq("id", tenant.id)
      .single();

    const onboardingComplete =
      tenantRow?.onboarding_status?.currentStep === "complete";

    if (!onboardingComplete) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (error) {
    console.error("[SetupTenantRedirect] Caught error, redirecting to /login:", error instanceof Error ? error.message : error);
    return NextResponse.redirect(`${origin}/login`);
  }
}
