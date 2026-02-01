'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from './ThemeProvider';
import {
  Home,
  MessageCircle,
  Bot,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  Zap
} from 'lucide-react';

interface DashboardShellProps {
  children: ReactNode;
  userName?: string;
  isConnected?: boolean;
}

const navItems = [
  { href: '/loomi/dashboard', label: 'Overview', icon: Home },
  { href: '/loomi/dashboard/connect', label: 'WhatsApp', icon: MessageCircle },
  { href: '/loomi/dashboard/agent', label: 'Agente', icon: Bot },
  { href: '/loomi/dashboard/crm', label: 'CRM', icon: Users },
  { href: '/loomi/dashboard/conversations', label: 'Inbox', icon: MessageCircle },
  { href: '/loomi/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/loomi/dashboard/settings', label: 'Settings', icon: Settings },
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
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-zinc-50'}`}>
      {/* Top Navigation */}
      <header className={`
        fixed top-0 left-0 right-0 z-50 h-14 border-b backdrop-blur-xl
        ${isDark ? 'bg-black/80 border-zinc-800' : 'bg-white/80 border-zinc-200'}
      `}>
        <div className="h-full max-w-[1800px] mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/loomi/dashboard" className="flex items-center gap-2">
            <div className={`
              w-7 h-7 rounded-lg flex items-center justify-center
              ${isDark ? 'bg-white' : 'bg-black'}
            `}>
              <Zap className={`w-4 h-4 ${isDark ? 'text-black' : 'text-white'}`} />
            </div>
            <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Loomi
            </span>
          </Link>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.slice(0, 6).map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/loomi/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative px-3 py-1.5 rounded-md text-sm font-medium
                    transition-colors duration-200 flex items-center gap-2
                    ${isActive
                      ? isDark ? 'text-white' : 'text-zinc-900'
                      : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className={`absolute inset-0 rounded-md ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div className={`
              hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs
              ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}
            `}>
              <span className={`
                w-1.5 h-1.5 rounded-full
                ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}
              `} />
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`
                p-2 rounded-lg transition-colors
                ${isDark
                  ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
                }
              `}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Settings */}
            <Link
              href="/loomi/dashboard/settings"
              className={`
                p-2 rounded-lg transition-colors
                ${isDark
                  ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
                }
              `}
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-2 pl-2 ml-2 border-l border-zinc-800">
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
                ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-600'}
              `}>
                {userName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleLogout}
                className={`
                  p-2 rounded-lg transition-colors
                  ${isDark
                    ? 'text-zinc-500 hover:text-red-400 hover:bg-zinc-800'
                    : 'text-zinc-400 hover:text-red-500 hover:bg-zinc-100'
                  }
                `}
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className={`
        md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl
        ${isDark ? 'bg-black/90 border-zinc-800' : 'bg-white/90 border-zinc-200'}
      `}>
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/loomi/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 px-3 py-1.5
                  ${isActive
                    ? isDark ? 'text-white' : 'text-zinc-900'
                    : isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-14 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
