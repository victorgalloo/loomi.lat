"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { createClient } from "@/lib/supabase/client";

interface PortalLayoutProps {
  children: React.ReactNode;
  userRole: "admin" | "client";
  userName?: string;
  clientName?: string;
}

export default function PortalLayout({
  children,
  userRole,
  userName,
  clientName,
}: PortalLayoutProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userRole={userRole}
        userName={userName}
        clientName={clientName}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}


