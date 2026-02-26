'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Search, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import ConversationDetailView from './[id]/ConversationDetailView';

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

interface ConversationDetail {
  conversation: {
    id: string;
    started_at: string;
    ended_at: string | null;
    summary: string | null;
    bot_paused: boolean;
  };
  lead: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    company: string | null;
    stage: string;
    industry: string | null;
  };
  messages: Array<{
    id: string;
    role: string;
    content: string;
    created_at: string;
    media_url?: string | null;
    media_type?: string | null;
    media_filename?: string | null;
  }>;
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
    'Cold': 'cold',
    'Warm': 'warm',
    'Hot': 'hot',
    'Ganado': 'ganado',
    'Perdido': 'perdido',
    'Nuevo': 'cold',
    'initial': 'cold',
    'Contactado': 'warm',
    'qualified': 'hot',
    'Calificado': 'hot',
    'Demo Agendada': 'hot',
    'demo_scheduled': 'hot',
    'Propuesta': 'hot',
    'Negociacion': 'hot',
    'customer': 'ganado',
    'cold': 'cold',
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
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [conversations, setConversations] = useState(initialConversations);
  const [handoffAlerts, setHandoffAlerts] = useState<HandoffAlert[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'));
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const dismissAlert = useCallback((id: string) => {
    setHandoffAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Load conversation detail when selected
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);

    fetch(`/api/conversations/${selectedId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(data => {
        if (!cancelled) setDetail(data);
      })
      .catch(err => {
        console.error('Load detail error:', err);
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => { cancelled = true; };
  }, [selectedId]);

  // URL sync (replaceState, no navigation)
  useEffect(() => {
    const url = selectedId
      ? `/dashboard/conversations?id=${selectedId}`
      : '/dashboard/conversations';
    window.history.replaceState(null, '', url);
  }, [selectedId]);

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
              stage: lead.stage || 'Cold',
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

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery ||
      conv.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.leadPhone.includes(searchQuery) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filter === 'all' || conv.broadcastClassification === filter;

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
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

  function handleSelectConversation(id: string) {
    setSelectedId(id);
  }

  function handleBack() {
    setSelectedId(null);
    setDetail(null);
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left panel: Conversation list */}
      <div className={`w-full lg:w-[350px] xl:w-[380px] flex-shrink-0 border-r border-border flex flex-col bg-background ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">Inbox</h1>
              <span className="text-label px-2 py-0.5 rounded-full font-medium bg-surface border border-border text-muted">
                {totalConversations}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-sm outline-none transition-colors duration-150 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
            />
          </div>

          {/* Stats inline */}
          <div className="flex items-center gap-2 text-xs text-muted mb-3">
            <span>{totalConversations} chats</span>
            <span className="text-border">|</span>
            <span>{activeToday} hoy</span>
            <span className="text-border">|</span>
            <span>{totalMessages} msgs</span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg w-fit bg-surface border border-border">
            {[
              { key: 'all', label: 'todas' },
              { key: 'hot', label: 'hot' },
              { key: 'warm', label: 'warm' },
              { key: 'cold', label: 'cold' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-foreground text-background'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Handoff Alerts */}
        {handoffAlerts.length > 0 && (
          <div className="px-4 pb-2 space-y-1.5 flex-shrink-0">
            {handoffAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-xl border text-xs
                  ${alert.priority === 'critical'
                    ? 'bg-terminal-red/10 border-terminal-red/20 text-terminal-red'
                    : alert.priority === 'urgent'
                      ? 'bg-terminal-yellow/10 border-terminal-yellow/20 text-terminal-yellow'
                      : 'bg-info/10 border-info/20 text-info'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-medium truncate">{alert.reason}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleSelectConversation(alert.conversationId)}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="px-1.5 py-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            <div>
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border hover:bg-surface-2 ${
                    selectedId === conversation.id ? 'bg-surface-2' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-info-muted text-info border border-border flex-shrink-0">
                    {conversation.leadName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-medium text-sm text-foreground truncate">
                          {conversation.leadName}
                        </span>
                        <span className="text-[11px] text-muted flex-shrink-0">
                          {getStageLabel(conversation.stage)}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted flex-shrink-0 ml-2">
                        {formatTimeAgo(conversation.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm text-muted">
                Sin resultados para &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : null}

          {conversations.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-surface border border-border">
                <MessageSquare className="w-5 h-5 text-muted" />
              </div>
              <h3 className="text-sm font-medium mb-1 text-foreground">Sin conversaciones</h3>
              <p className="text-xs text-muted">
                Las conversaciones aparecerán cuando tus clientes te escriban por WhatsApp
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Chat detail */}
      <div className={`flex-1 flex flex-col min-w-0 bg-background ${selectedId ? 'flex' : 'hidden lg:flex'}`}>
        {selectedId && detail ? (
          <ConversationDetailView
            conversation={detail.conversation}
            lead={detail.lead}
            messages={detail.messages}
            embedded
            onBack={handleBack}
          />
        ) : selectedId && loadingDetail ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted">
              <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-surface border border-border">
                <MessageSquare className="w-6 h-6 text-muted" />
              </div>
              <p className="text-sm text-muted">
                Selecciona una conversación
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
