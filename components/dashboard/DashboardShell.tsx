'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Image from 'next/image';

interface DashboardShellProps {
  children: ReactNode;
  userName?: string;
  tenantName?: string;
  isConnected?: boolean;
}

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/crm': 'Pipeline',
  '/dashboard/conversations': 'Inbox',
  '/broadcasts': 'Broadcasts',
  '/dashboard/agent/setup': 'Agente / Setup',
  '/dashboard/agent/prompt': 'Agente / Prompt',
  '/dashboard/agent/knowledge': 'Agente / Knowledge',
  '/dashboard/agent/tools': 'Agente / Integraciones',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/settings': 'Settings',
  '/dashboard/connect': 'Conexión WhatsApp',
};

function getBreadcrumb(pathname: string): string {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];
  // Conversation detail
  if (pathname.startsWith('/dashboard/conversations/')) return 'Inbox / Conversación';
  // Broadcast detail
  if (pathname.startsWith('/broadcasts/')) return 'Broadcasts / Campaña';
  // Agent sub-routes
  if (pathname.startsWith('/dashboard/agent')) return 'Agente';
  return 'Dashboard';
}

export default function DashboardShell({ children, userName, tenantName, isConnected }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('loomi-theme', next);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        userName={userName}
        tenantName={tenantName}
        isConnected={isConnected}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 shrink-0">
          {/* Left: mobile menu + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {getBreadcrumb(pathname)}
            </span>
          </div>

          {/* Right: status + theme + meta */}
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${
              isConnected
                ? 'text-terminal-green bg-terminal-green/10'
                : 'text-terminal-yellow bg-terminal-yellow/10'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-terminal-green' : 'bg-terminal-yellow'}`} />
              {isConnected ? 'Conectado' : 'Offline'}
            </div>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md transition-colors text-muted hover:text-foreground hover:bg-surface"
            >
              <Sun className="w-4 h-4 hidden [html[data-theme=dark]_&]:block" />
              <Moon className="w-4 h-4 block [html[data-theme=dark]_&]:hidden" />
            </button>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-surface">
              <Image src="/logos/meta-logo.png" alt="Meta" width={40} height={13} className="object-contain opacity-50" />
              <span className="text-muted text-xs">Tech Provider</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
