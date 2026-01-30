"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="px-6 py-3 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: `var(--card-bg)`,
        border: 'none',
        color: `var(--foreground)`,
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.currentTarget.style.backgroundColor = `var(--accent)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          e.currentTarget.style.backgroundColor = `var(--card-bg)`;
        }
      }}
    >
      {isLoading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}

