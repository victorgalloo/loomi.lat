'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Search, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import StatCard from '@/components/dashboard/StatCard';

interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
  stage: string;
  broadcastClassification?: string;
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
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
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
            .select('id, name, phone, stage, broadcast_classification, tenant_id')
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
              broadcastClassification: lead.broadcast_classification || undefined,
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

  const CLASSIFICATION_ORDER: Record<string, number> = { hot: 0, warm: 1, cold: 2, bot_autoresponse: 3 };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery ||
      conv.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.leadPhone.includes(searchQuery) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filter === 'all' || conv.broadcastClassification === filter;

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    const orderA = a.broadcastClassification ? (CLASSIFICATION_ORDER[a.broadcastClassification] ?? 4) : 4;
    const orderB = b.broadcastClassification ? (CLASSIFICATION_ORDER[b.broadcastClassification] ?? 4) : 4;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
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
    <div className="px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">
            Inbox
          </h1>
          <span className="text-label px-2.5 py-1 rounded-full font-medium bg-surface border border-border text-muted">
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
              className="w-48 pl-9 pr-3 py-1.5 rounded-xl text-sm outline-none transition-colors duration-150 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Chats" value={totalConversations} />
        <StatCard label="Activas Hoy" value={activeToday} />
        <StatCard label="Mensajes" value={totalMessages} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl mb-6 w-fit bg-surface border border-border">
        {[
          { key: 'all', label: 'todas' },
          { key: 'hot', label: '🔥 hot' },
          { key: 'warm', label: '🟡 warm' },
          { key: 'cold', label: '🥶 cold' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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
                flex items-center justify-between px-4 py-3 rounded-2xl border
                ${alert.priority === 'critical'
                  ? 'bg-terminal-red/10 border-terminal-red/20 text-terminal-red'
                  : alert.priority === 'urgent'
                    ? 'bg-terminal-yellow/10 border-terminal-yellow/20 text-terminal-yellow'
                    : 'bg-info/10 border-info/20 text-info'
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
        <div className="divide-y divide-border border-t border-border">
          {filteredConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/dashboard/conversations/${conversation.id}`}
              className="flex items-center justify-between py-3 -mx-3 px-3 rounded-xl transition-colors hover:bg-surface-2"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-info-muted text-info border border-border flex-shrink-0">
                  {conversation.leadName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">
                      {conversation.leadName}
                    </span>
                    <span className="text-xs text-muted">
                      {getStageLabel(conversation.stage)}
                    </span>
                    {conversation.broadcastClassification && conversation.broadcastClassification !== 'bot_autoresponse' && (
                      <span className={`text-xs ${
                        conversation.broadcastClassification === 'hot'
                          ? 'text-warning'
                          : conversation.broadcastClassification === 'warm'
                            ? 'text-terminal-yellow'
                            : 'text-info'
                      }`}>
                        {conversation.broadcastClassification === 'hot' ? '🔥' : conversation.broadcastClassification === 'warm' ? '🟡' : '🥶'}
                      </span>
                    )}
                    {conversation.broadcastClassification === 'bot_autoresponse' && (
                      <span className="text-xs text-muted">🤖</span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate max-w-[400px]">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0 text-xs text-muted">
                <span className="font-mono">{conversation.leadPhone}</span>
                <span>{conversation.messageCount} msgs</span>
                <span>{formatTimeAgo(conversation.lastMessageTime)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted">
            No se encontraron resultados para &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : null}

      {/* Empty State */}
      {conversations.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-surface border border-border">
            <MessageSquare className="w-6 h-6 text-muted" />
          </div>
          <h3 className="text-base font-medium mb-1 text-foreground">
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
