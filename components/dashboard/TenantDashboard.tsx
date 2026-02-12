'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
    totalLeads: number;
    activeConversations: number;
    warmLeads: number;
    hotLeads: number;
  };
  tenantId: string;
}

export default function TenantDashboard({
  tenant,
  whatsappAccount,
  stats: initialStats,
  tenantId
}: TenantDashboardProps) {
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
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as { broadcast_classification?: string };
            const old = payload.old as { broadcast_classification?: string };
            if (updated.broadcast_classification !== old.broadcast_classification) {
              setStats(prev => {
                let { warmLeads, hotLeads } = prev;
                if (old.broadcast_classification === 'warm') warmLeads--;
                if (old.broadcast_classification === 'hot') hotLeads--;
                if (updated.broadcast_classification === 'warm') warmLeads++;
                if (updated.broadcast_classification === 'hot') hotLeads++;
                return { ...prev, warmLeads: Math.max(0, warmLeads), hotLeads: Math.max(0, hotLeads) };
              });
            }
          }
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
          setStats(prev => ({ ...prev, activeConversations: prev.activeConversations + 1 }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">
          Hola, {tenant.name.split(' ')[0]}
        </h1>
        <p className="text-sm mt-1 text-muted">
          {tenant.companyName || tenant.email}
        </p>
      </div>

      {/* Stats inline */}
      <div className="flex items-center gap-6 text-sm mb-8 pb-6 border-b border-border flex-wrap">
        <div><span className="text-muted">Leads</span> <span className="font-semibold tabular-nums">{stats.totalLeads}</span></div>
        <span className="text-border">|</span>
        <div><span className="text-muted">Conversaciones</span> <span className="font-semibold tabular-nums">{stats.activeConversations}</span></div>
        <span className="text-border">|</span>
        <div><span className="text-muted">Tibios</span> <span className="font-semibold tabular-nums">{stats.warmLeads}</span></div>
        <span className="text-border">|</span>
        <div><span className="text-muted">Calientes</span> <span className="font-semibold tabular-nums">{stats.hotLeads}</span></div>
        <span className="text-border">|</span>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${whatsappAccount.connected ? 'bg-terminal-green' : 'bg-terminal-yellow'}`} />
          <span className="text-muted">
            {whatsappAccount.connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <span className="text-border">|</span>
        <span className="text-muted">{tenant.subscriptionTier}</span>
      </div>

      {/* Links */}
      <nav className="space-y-1">
        <Link
          href="/dashboard/crm"
          className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl group text-muted hover:text-foreground hover:bg-surface transition-colors"
        >
          <span>Pipeline</span>
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link
          href="/dashboard/conversations"
          className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl group text-muted hover:text-foreground hover:bg-surface transition-colors"
        >
          <span>Conversaciones</span>
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link
          href="/dashboard/agent/setup"
          className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl group text-muted hover:text-foreground hover:bg-surface transition-colors"
        >
          <span>Configurar Agente</span>
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {!whatsappAccount.connected && (
          <Link
            href="/dashboard/connect"
            className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl group text-terminal-yellow hover:text-terminal-yellow/80 hover:bg-terminal-yellow/5 transition-colors"
          >
            <span>Conectar WhatsApp</span>
            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}
      </nav>
    </div>
  );
}
