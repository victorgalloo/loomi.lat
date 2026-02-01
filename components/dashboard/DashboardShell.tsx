'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from './ThemeProvider';
import { LogOut, Sun, Moon } from 'lucide-react';

interface DashboardShellProps {
  children: ReactNode;
  userName?: string;
  isConnected?: boolean;
}

const navItems = [
  { href: '/loomi/dashboard', label: 'Overview' },
  { href: '/loomi/dashboard/crm', label: 'Pipeline' },
  { href: '/loomi/dashboard/conversations', label: 'Inbox' },
  { href: '/loomi/dashboard/agent', label: 'Agente' },
  { href: '/loomi/dashboard/settings', label: 'Settings' },
];

export default function DashboardShell({ children, userName, isConnected }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <header className={`
        fixed top-0 left-0 right-0 z-50 h-12 border-b
        ${isDark ? 'bg-black border-zinc-900' : 'bg-white border-zinc-100'}
      `}>
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/loomi/dashboard"
            className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}
          >
            loomi
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/loomi/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    text-sm transition-colors
                    ${isActive
                      ? isDark ? 'text-white' : 'text-zinc-900'
                      : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded transition-colors ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLogout}
              className={`p-1.5 rounded transition-colors ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
              title="Salir"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className={`
        md:hidden fixed bottom-0 left-0 right-0 z-50 border-t
        ${isDark ? 'bg-black border-zinc-900' : 'bg-white border-zinc-100'}
      `}>
        <div className="flex items-center justify-around py-3">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/loomi/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  text-xs font-medium
                  ${isActive
                    ? isDark ? 'text-white' : 'text-zinc-900'
                    : isDark ? 'text-zinc-600' : 'text-zinc-400'
                  }
                `}
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
