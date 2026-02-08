'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Sun, Moon } from 'lucide-react';

interface DashboardShellProps {
  children: ReactNode;
  userName?: string;
  isConnected?: boolean;
}

const navItems = [
  { href: '/dashboard', label: 'overview' },
  { href: '/dashboard/crm', label: 'pipeline' },
  { href: '/dashboard/conversations', label: 'inbox' },
  { href: '/broadcasts', label: 'broadcasts' },
  { href: '/dashboard/agent', label: 'agente', subItems: [
    { href: '/dashboard/agent', label: 'config' },
    { href: '/dashboard/agent/prompt', label: 'prompt' },
    { href: '/dashboard/agent/knowledge', label: 'knowledge' },
    { href: '/dashboard/agent/tools', label: 'tools' },
  ]},
  { href: '/dashboard/settings', label: 'settings' },
];

export default function DashboardShell({ children, isConnected }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('loomi-theme', next);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background/95 backdrop-blur-md border-border shadow-subtle">
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-terminal-red" />
              <div className="w-2 h-2 rounded-full bg-terminal-yellow" />
              <div className="w-2 h-2 rounded-full bg-terminal-green" />
            </div>
            <span className="text-sm font-semibold text-foreground font-mono">loomi_</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-body transition-colors font-mono px-3 py-1.5 rounded-lg ${
                    isActive
                      ? 'text-foreground bg-surface-2'
                      : 'text-muted hover:text-foreground hover:bg-surface'
                  }`}
                >
                  ./{item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${isConnected ? 'bg-terminal-green/10 border-terminal-green/20' : 'bg-terminal-yellow/10 border-terminal-yellow/20'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-terminal-green' : 'bg-terminal-yellow'}`} />
              <span className={`text-sm font-mono ${isConnected ? 'text-terminal-green' : 'text-terminal-yellow'}`}>
                {isConnected ? 'live' : 'offline'}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors text-muted hover:text-foreground hover:bg-surface-2"
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 block dark:hidden" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-colors text-muted hover:text-foreground hover:bg-surface-2"
              title="Salir"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md border-border shadow-elevated">
        <div className="flex items-center justify-around py-3">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium font-mono px-2 py-1 rounded-lg ${
                  isActive
                    ? 'text-foreground bg-surface-2'
                    : 'text-muted'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Agent Sub-Nav */}
      {pathname.startsWith('/dashboard/agent') && (
        <div className="fixed top-14 left-0 right-0 z-40 h-10 border-b bg-surface/95 backdrop-blur-sm border-border shadow-subtle">
          <div className="h-full max-w-6xl mx-auto px-4 flex items-center gap-4">
            {navItems.find(i => i.href === '/dashboard/agent')?.subItems?.map((sub) => {
              const isSubActive = pathname === sub.href;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className={`text-sm transition-colors font-mono px-2.5 py-1 rounded-lg ${
                    isSubActive
                      ? 'text-foreground bg-surface-2'
                      : 'text-muted hover:text-foreground hover:bg-surface'
                  }`}
                >
                  ./{sub.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <main className={`${pathname.startsWith('/dashboard/agent') ? 'pt-[96px]' : 'pt-14'} pb-16 md:pb-0`}>
        {children}
      </main>
    </div>
  );
}
