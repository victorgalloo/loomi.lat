"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface SidebarProps {
  userRole: "admin" | "client";
  userName?: string;
  clientName?: string;
  onLogout: () => void;
}

const adminNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Clientes",
    href: "/dashboard/clients",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

const clientNavItems = [
  {
    label: "Mi Portal",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Propuestas",
    href: "/dashboard/proposals",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Documentos",
    href: "/dashboard/documents",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
];

export default function Sidebar({ userRole, userName, clientName, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const navItems = userRole === "admin" ? adminNavItems : clientNavItems;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-40">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">anthana.agency</span>
          <span className="text-xl font-light text-gray-500">portal</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  font-medium text-sm transition-all duration-200
                  ${isActive 
                    ? "bg-[#FF3621]/10 text-[#FF3621]" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <span className={isActive ? "text-[#FF3621]" : "text-gray-400"}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF3621]"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF3621] to-[#FF6B35] flex items-center justify-center text-white font-semibold">
            {(clientName || userName || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {clientName || userName || "Usuario"}
            </p>
            <p className="text-xs text-gray-500">
              {userRole === "admin" ? "Administrador" : "Cliente"}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}


