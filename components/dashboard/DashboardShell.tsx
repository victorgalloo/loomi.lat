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
  { href: '/dashboard/broadcasts', label: 'broadcasts' },
  { href: '/dashboard/agent', label: 'agente' },
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
      <header className="fixed top-0 left-0 right-0 z-50 h-12 border-b bg-background border-border">
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
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm transition-colors font-mono ${
                    isActive
                      ? 'text-foreground'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  ./{item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-terminal-green' : 'bg-terminal-yellow'}`} />
              <span className="text-xs text-muted font-mono">
                {isConnected ? 'live' : 'offline'}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded transition-colors text-muted hover:text-foreground"
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 block dark:hidden" />
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded transition-colors text-muted hover:text-foreground"
              title="Salir"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background border-border">
        <div className="flex items-center justify-around py-3">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs font-medium font-mono ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="pt-12 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
