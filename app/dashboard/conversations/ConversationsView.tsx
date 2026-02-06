'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Search, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
  stage: string;
}

interface ConversationsViewProps {
  conversations: Conversation[];
  tenantId: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function getStageLabel(stage: string): string {
  const stages: Record<string, string> = {
    'Nuevo': 'nuevo',
    'initial': 'nuevo',
    'Contactado': 'contactado',
    'qualified': 'calificado',
    'Calificado': 'calificado',
    'Demo Agendada': 'demo',
    'demo_scheduled': 'demo',
    'Propuesta': 'propuesta',
    'Negociacion': 'negociación',
    'Ganado': 'ganado',
    'customer': 'cliente',
    'Perdido': 'perdido',
    'cold': 'frío',
  };
  return stages[stage] || stage;
}

interface HandoffAlert {
  id: string;
  conversationId: string;
  reason: string;
  priority: string;
  createdAt: string;
}

export default function ConversationsView({ conversations: initialConversations, tenantId }: ConversationsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [conversations, setConversations] = useState(initialConversations);
  const [handoffAlerts, setHandoffAlerts] = useState<HandoffAlert[]>([]);

  const dismissAlert = useCallback((id: string) => {
    setHandoffAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Realtime subscription for messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as { conversation_id: string; content: string; created_at: string };

          setConversations(prev => prev.map(conv =>
            conv.id === newMessage.conversation_id
              ? {
                  ...conv,
                  lastMessage: newMessage.content,
                  lastMessageTime: newMessage.created_at,
                  messageCount: conv.messageCount + 1,
                }
              : conv
          ).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        async (payload) => {
          const newConv = payload.new as { id: string; lead_id: string; started_at: string };

          const { data: lead } = await supabase
            .from('leads')
            .select('id, name, phone, stage, tenant_id')
            .eq('id', newConv.lead_id)
            .single();

          if (lead && lead.tenant_id === tenantId) {
            setConversations(prev => [{
              id: newConv.id,
              leadId: lead.id,
              leadName: lead.name || 'Usuario',
              leadPhone: lead.phone,
              lastMessage: 'Nueva conversación',
              lastMessageTime: newConv.started_at,
              messageCount: 0,
              stage: lead.stage || 'Nuevo',
            }, ...prev]);
          }
        }
      )
      .subscribe();

    // Handoffs subscription
    const handoffsChannel = supabase
      .channel('handoffs-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'handoffs',
        },
        (payload) => {
          const handoff = payload.new as {
            id: string;
            conversation_id: string;
            reason: string;
            priority: string;
            created_at: string;
            tenant_id: string;
          };

          if (handoff.tenant_id === tenantId) {
            setHandoffAlerts(prev => [{
              id: handoff.id,
              conversationId: handoff.conversation_id,
              reason: handoff.reason,
              priority: handoff.priority,
              createdAt: handoff.created_at,
            }, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(handoffsChannel);
    };
  }, [tenantId]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery ||
      conv.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.leadPhone.includes(searchQuery) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Stats
  const totalConversations = conversations.length;
  const activeToday = conversations.filter(c => {
    const date = new Date(c.lastMessageTime);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length;
  const totalMessages = conversations.reduce((sum, c) => sum + c.messageCount, 0);

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground font-mono">
            ./inbox_
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-surface border border-border text-muted font-mono">
            {totalConversations} chats
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none transition-colors duration-150 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-8 pb-6 mb-6 border-b border-border">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-mono">
            total chats
          </p>
          <p className="text-xl font-semibold font-mono mt-1 text-foreground">
            {totalConversations}
          </p>
        </div>

        <div className="w-px h-8 bg-border" />

        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-mono">
            activas hoy
          </p>
          <p className="text-xl font-semibold font-mono mt-1 text-accent-green">
            {activeToday}
          </p>
        </div>

        <div className="w-px h-8 bg-border" />

        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-mono">
            mensajes
          </p>
          <p className="text-xl font-semibold font-mono mt-1 text-foreground">
            {totalMessages}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg mb-6 w-fit bg-surface border border-border">
        {[
          { key: 'all', label: 'todas' },
          { key: 'active', label: 'activas' },
          { key: 'archived', label: 'archivadas' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors font-mono ${
              filter === tab.key
                ? 'bg-foreground text-background'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Handoff Alerts */}
      {handoffAlerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {handoffAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`
                flex items-center justify-between px-4 py-3 rounded-lg border font-mono
                ${alert.priority === 'critical'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : alert.priority === 'urgent'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    Handoff: {alert.reason}
                  </p>
                  <p className="text-xs opacity-70">
                    Prioridad: {alert.priority}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {alert.conversationId && (
                  <Link
                    href={`/dashboard/conversations/${alert.conversationId}`}
                    className="px-3 py-1 rounded text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
                  >
                    Ver chat
                  </Link>
                )}
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="px-2 py-1 rounded text-xs opacity-60 hover:opacity-100 transition-opacity"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conversation List */}
      {filteredConversations.length > 0 ? (
        <div className="rounded-xl overflow-hidden bg-surface border border-border">
          <ul className="divide-y divide-border">
            {filteredConversations.map((conversation) => {
              return (
                <li key={conversation.id}>
                  <Link
                    href={`/dashboard/conversations/${conversation.id}`}
                    className="block transition-colors hover:bg-surface-2"
                  >
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-medium bg-surface-2 text-muted font-mono">
                            {conversation.leadName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm text-foreground">
                                {conversation.leadName}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-muted font-mono">
                                {getStageLabel(conversation.stage)}
                              </span>
                            </div>
                            <p className="text-xs mt-0.5 text-muted font-mono">
                              {conversation.leadPhone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted font-mono">
                            {formatTimeAgo(conversation.lastMessageTime)}
                          </p>
                          <p className="text-xs mt-0.5 text-muted/50 font-mono">
                            {conversation.messageCount} msgs
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm line-clamp-1 pl-[60px] text-muted">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted font-mono">
            No se encontraron resultados para &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : null}

      {/* Empty State */}
      {conversations.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center bg-surface border border-border">
            <MessageSquare className="w-6 h-6 text-muted" />
          </div>
          <h3 className="text-base font-medium mb-1 text-foreground font-mono">
            Sin conversaciones
          </h3>
          <p className="text-sm max-w-sm mx-auto text-muted">
            Las conversaciones aparecerán cuando tus clientes te escriban por WhatsApp
          </p>
        </div>
      )}
    </div>
  );
}
