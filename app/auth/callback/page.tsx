"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const supabase = createClient();
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const errorParam = url.searchParams.get("error");

    if (errorParam) {
      console.error("[AuthCallback] Error from Supabase:", errorParam);
      window.location.href = "/login?error=magic_link_expired";
      return;
    }

    // PKCE flow: exchange code for session
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error("[AuthCallback] exchangeCodeForSession failed:", error.message);
          window.location.href = "/login?error=magic_link_expired";
        } else {
          console.log("[AuthCallback] Code exchanged, redirecting to setup");
          window.location.href = "/api/auth/setup-tenant-redirect";
        }
      });
      return;
    }

    // Hash fragment flow: Supabase browser client auto-detects tokens
    // via detectSessionInUrl (default: true)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        console.log("[AuthCallback] Session detected from hash, redirecting to setup");
        subscription.unsubscribe();
        window.location.href = "/api/auth/setup-tenant-redirect";
      }
    });

    // Timeout: if no session after 5s, redirect to login
    setTimeout(() => {
      console.error("[AuthCallback] Timeout — no session established");
      window.location.href = "/login?error=magic_link_expired";
    }, 5000);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted mx-auto" />
        <p className="text-sm text-muted font-mono">Verificando acceso...</p>
      </div>
    </div>
  );
}
