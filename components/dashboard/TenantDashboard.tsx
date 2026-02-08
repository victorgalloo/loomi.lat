'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Users, MessageCircle, Mail, Calendar } from 'lucide-react';
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
        <h1 className="text-xl font-medium text-foreground font-mono">
          {tenant.name.split(' ')[0]}_
        </h1>
        <p className="text-sm mt-1 text-muted">
          {tenant.companyName || tenant.email}
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-6 text-sm mb-12 pb-8 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${whatsappAccount.connected ? 'bg-terminal-green' : 'bg-terminal-yellow'}`} />
          <span className="text-muted">
            {whatsappAccount.connected ? 'conectado' : 'desconectado'}
          </span>
        </div>
        <span className="text-border">·</span>
        <span className="text-muted font-mono">
          {tenant.subscriptionTier}
        </span>
        <span className="text-border">·</span>
        <span className="text-muted">
          {stats.totalLeads} leads
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-surface-elevated border border-border border-l-[3px] border-l-info rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">leads</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-info-muted">
              <Users className="w-4 h-4 text-info" />
            </div>
          </div>
          <p className="text-3xl font-mono text-foreground">
            {stats.totalLeads}
          </p>
        </div>
        <div className="bg-surface-elevated border border-border border-l-[3px] border-l-info rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">conversaciones</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-info-muted">
              <MessageCircle className="w-4 h-4 text-info" />
            </div>
          </div>
          <p className="text-3xl font-mono text-foreground">
            {stats.totalConversations}
          </p>
        </div>
        <div className="bg-surface-elevated border border-border border-l-[3px] border-l-info rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">mensajes</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-info-muted">
              <Mail className="w-4 h-4 text-info" />
            </div>
          </div>
          <p className="text-3xl font-mono text-foreground">
            {stats.messagesThisMonth}
          </p>
        </div>
        <div className="bg-surface-elevated border border-border border-l-[3px] border-l-info rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">citas</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-info-muted">
              <Calendar className="w-4 h-4 text-info" />
            </div>
          </div>
          <p className="text-3xl font-mono text-foreground">
            {stats.appointmentsBooked}
          </p>
        </div>
      </div>

      {/* Links */}
      <nav className="space-y-1 border-t pt-8 border-border">
        <Link
          href="/dashboard/crm"
          className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl group text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <span className="font-mono">./pipeline</span>
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link
          href="/dashboard/conversations"
          className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl group text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <span className="font-mono">./conversaciones</span>
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link
          href="/dashboard/agent"
          className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl group text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <span className="font-mono">./configurar-agente</span>
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {!whatsappAccount.connected && (
          <Link
            href="/dashboard/connect"
            className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl group text-terminal-yellow hover:text-terminal-yellow/80 hover:bg-terminal-yellow/5 transition-colors"
          >
            <span className="font-mono">./conectar-whatsapp</span>
            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}
      </nav>
    </div>
  );
}
