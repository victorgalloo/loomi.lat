'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Kanban,
  MessageSquare,
  Send,
  Settings2,
  FileText,
  BookOpen,
  Plug,
  BarChart3,
  Settings,
  Phone,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  X,
} from 'lucide-react';

interface SidebarProps {
  userName?: string;
  tenantName?: string;
  isConnected?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const configurarNav: NavItem[] = [
  { href: '/dashboard/agent/setup', label: 'Setup', icon: <Settings2 className="w-[18px] h-[18px]" /> },
  { href: '/dashboard/agent/prompt', label: 'Prompt', icon: <FileText className="w-[18px] h-[18px]" /> },
  { href: '/dashboard/agent/knowledge', label: 'Knowledge', icon: <BookOpen className="w-[18px] h-[18px]" /> },
  { href: '/dashboard/agent/tools', label: 'Integraciones', icon: <Plug className="w-[18px] h-[18px]" /> },
];

const monitorearNav: NavItem[] = [
  { href: '/dashboard/crm', label: 'Pipeline', icon: <Kanban className="w-[18px] h-[18px]" /> },
  { href: '/dashboard/conversations', label: 'Inbox', icon: <MessageSquare className="w-[18px] h-[18px]" /> },
  { href: '/broadcasts', label: 'Broadcasts', icon: <Send className="w-[18px] h-[18px]" /> },
];

const configuracionNav: NavItem[] = [
  { href: '/dashboard/analytics', label: 'Analytics', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
  { href: '/dashboard/connect', label: 'WhatsApp', icon: <Phone className="w-[18px] h-[18px]" /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" /> },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href === '/broadcasts') return pathname.startsWith('/broadcasts');
  return pathname.startsWith(href);
}

function NavSection({ label, items, collapsed, renderNavItem }: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  renderNavItem: (item: NavItem) => React.ReactNode;
}) {
  return (
    <div className="mt-5">
      {!collapsed && (
        <p className="text-[11px] uppercase tracking-widest text-muted px-3 mb-2 select-none">
          {label}
        </p>
      )}
      {collapsed && <div className="border-t border-border my-2" />}
      <ul className="space-y-0.5">
        {items.map(renderNavItem)}
      </ul>
    </div>
  );
}

export default function Sidebar({ userName, tenantName, isConnected, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('loomi-sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('loomi-sidebar-collapsed', String(next));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const renderNavItem = (item: NavItem) => {
    const active = isRouteActive(pathname, item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onMobileClose}
          className={`
            relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
            ${active
              ? 'bg-surface-2 text-foreground font-medium'
              : 'text-muted hover:text-foreground hover:bg-surface'
            }
            ${collapsed ? 'justify-center px-0' : ''}
          `}
          title={collapsed ? item.label : undefined}
        >
          {active && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 bg-surface-2 rounded-lg"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ zIndex: 0 }}
            />
          )}
          <span className="relative z-10 shrink-0">{item.icon}</span>
          {!collapsed && <span className="relative z-10">{item.label}</span>}
        </Link>
      </li>
    );
  };

  const homeItem: NavItem = { href: '/dashboard', label: 'Home', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> };

  const sidebarContent = (
    <div className={`flex flex-col h-full ${collapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]'} transition-all duration-200`}>
      {/* Header: traffic dots + brand */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
              <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
              <div className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
            </div>
            <span className="text-sm font-semibold font-mono text-foreground">loomi_</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 mx-auto">
            <div className="w-2 h-2 rounded-full bg-terminal-red" />
            <div className="w-2 h-2 rounded-full bg-terminal-yellow" />
            <div className="w-2 h-2 rounded-full bg-terminal-green" />
          </div>
        )}
        <button
          onClick={mobileOpen ? onMobileClose : toggleCollapse}
          className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors hidden md:flex items-center justify-center"
        >
          {mobileOpen ? (
            <X className="w-4 h-4" />
          ) : collapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {/* Home standalone */}
        <ul className="space-y-0.5">
          {renderNavItem(homeItem)}
        </ul>

        {/* CONFIGURAR section */}
        <NavSection label="Configurar" items={configurarNav} collapsed={collapsed} renderNavItem={renderNavItem} />

        {/* MONITOREAR section */}
        <NavSection label="Monitorear" items={monitorearNav} collapsed={collapsed} renderNavItem={renderNavItem} />

        {/* CONFIGURACIÓN section */}
        <NavSection label="Configuración" items={configuracionNav} collapsed={collapsed} renderNavItem={renderNavItem} />
      </nav>

      {/* WhatsApp status */}
      <div className="px-3 py-2 border-t border-border shrink-0">
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'px-3 py-1.5'}`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-terminal-green' : 'bg-terminal-yellow'}`} />
          {!collapsed && (
            <span className="text-xs text-muted">
              {isConnected ? 'WhatsApp conectado' : 'Sin conexión'}
            </span>
          )}
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-border shrink-0">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-foreground">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {userName || 'Usuario'}
                </p>
                {tenantName && (
                  <p className="text-xs text-muted truncate">{tenantName}</p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex bg-background border-r border-border h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-0 left-0 z-50 h-full bg-background border-r border-border md:hidden"
            >
              <div className="flex justify-end p-2">
                <button
                  onClick={onMobileClose}
                  className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
