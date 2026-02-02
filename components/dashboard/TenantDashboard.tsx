'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import { ArrowUpRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TenantDashboardProps {
  tenant: {
    name: string;
    email: string;
    companyName: string | null;
    subscriptionTier: string;
    subscriptionStatus: string;
  };
  whatsappAccount: {
    connected: boolean;
    phoneNumber?: string;
    businessName?: string;
  };
  stats: {
    totalConversations: number;
    totalLeads: number;
    messagesThisMonth: number;
    appointmentsBooked: number;
  };
  tenantId: string;
}

export default function TenantDashboard({
  tenant,
  whatsappAccount,
  stats: initialStats,
  tenantId
}: TenantDashboardProps) {
  const { isDark } = useTheme();
  const [stats, setStats] = useState(initialStats);

  // Realtime subscription for stats
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('dashboard-stats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          setStats(prev => ({ ...prev, totalLeads: prev.totalLeads + 1 }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          setStats(prev => ({ ...prev, totalConversations: prev.totalConversations + 1 }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          setStats(prev => ({ ...prev, messagesThisMonth: prev.messagesThisMonth + 1 }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          setStats(prev => ({ ...prev, appointmentsBooked: prev.appointmentsBooked + 1 }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className={`text-xl font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          {tenant.name.split(' ')[0]}
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          {tenant.companyName || tenant.email}
        </p>
      </div>

      {/* Status */}
      <div className={`flex items-center gap-6 text-sm mb-12 pb-8 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${whatsappAccount.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
            {whatsappAccount.connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <span className={isDark ? 'text-zinc-600' : 'text-zinc-300'}>·</span>
        <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
          {tenant.subscriptionTier}
        </span>
        <span className={isDark ? 'text-zinc-600' : 'text-zinc-300'}>·</span>
        <span className={`${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {stats.totalLeads} leads
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-8 mb-12">
        <div>
          <p className={`text-2xl font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {stats.totalLeads}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Leads
          </p>
        </div>
        <div>
          <p className={`text-2xl font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {stats.totalConversations}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Conversaciones
          </p>
        </div>
        <div>
          <p className={`text-2xl font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {stats.messagesThisMonth}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Mensajes
          </p>
        </div>
        <div>
          <p className={`text-2xl font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {stats.appointmentsBooked}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Citas
          </p>
        </div>
      </div>

      {/* Links */}
      <nav className={`space-y-1 border-t pt-8 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <Link
          href="/loomi/dashboard/crm"
          className={`
            flex items-center justify-between py-3 group
            ${isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-zinc-900'}
          `}
        >
          <span>Pipeline</span>
          <ArrowUpRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
        </Link>

        <Link
          href="/loomi/dashboard/conversations"
          className={`
            flex items-center justify-between py-3 group
            ${isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-zinc-900'}
          `}
        >
          <span>Conversaciones</span>
          <ArrowUpRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
        </Link>

        <Link
          href="/loomi/dashboard/agent"
          className={`
            flex items-center justify-between py-3 group
            ${isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-zinc-900'}
          `}
        >
          <span>Configurar agente</span>
          <ArrowUpRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
        </Link>

        {!whatsappAccount.connected && (
          <Link
            href="/loomi/dashboard/connect"
            className={`
              flex items-center justify-between py-3 group
              ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}
            `}
          >
            <span>Conectar WhatsApp</span>
            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}
      </nav>
    </div>
  );
}
