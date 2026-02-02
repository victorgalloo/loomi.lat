'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Search, Clock } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/dashboard/ThemeProvider';
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

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function getStageStyle(stage: string, isDarkMode: boolean): { label: string; bg: string; text: string } {
  const stages: Record<string, { label: string; lightBg: string; lightText: string; darkBg: string; darkText: string }> = {
    'Nuevo': { label: 'Nuevo', lightBg: 'bg-cyan-50', lightText: 'text-cyan-700', darkBg: 'bg-cyan-500/10', darkText: 'text-cyan-400' },
    'initial': { label: 'Nuevo', lightBg: 'bg-cyan-50', lightText: 'text-cyan-700', darkBg: 'bg-cyan-500/10', darkText: 'text-cyan-400' },
    'Contactado': { label: 'Contactado', lightBg: 'bg-amber-50', lightText: 'text-amber-700', darkBg: 'bg-amber-500/10', darkText: 'text-amber-400' },
    'qualified': { label: 'Calificado', lightBg: 'bg-purple-50', lightText: 'text-purple-700', darkBg: 'bg-purple-500/10', darkText: 'text-purple-400' },
    'Calificado': { label: 'Calificado', lightBg: 'bg-purple-50', lightText: 'text-purple-700', darkBg: 'bg-purple-500/10', darkText: 'text-purple-400' },
    'Demo Agendada': { label: 'Demo Agendada', lightBg: 'bg-indigo-50', lightText: 'text-indigo-700', darkBg: 'bg-indigo-500/10', darkText: 'text-indigo-400' },
    'demo_scheduled': { label: 'Demo Agendada', lightBg: 'bg-indigo-50', lightText: 'text-indigo-700', darkBg: 'bg-indigo-500/10', darkText: 'text-indigo-400' },
    'Propuesta': { label: 'Propuesta', lightBg: 'bg-blue-50', lightText: 'text-blue-700', darkBg: 'bg-blue-500/10', darkText: 'text-blue-400' },
    'Negociacion': { label: 'Negociacion', lightBg: 'bg-orange-50', lightText: 'text-orange-700', darkBg: 'bg-orange-500/10', darkText: 'text-orange-400' },
    'Ganado': { label: 'Ganado', lightBg: 'bg-emerald-50', lightText: 'text-emerald-700', darkBg: 'bg-emerald-500/10', darkText: 'text-emerald-400' },
    'customer': { label: 'Cliente', lightBg: 'bg-emerald-50', lightText: 'text-emerald-700', darkBg: 'bg-emerald-500/10', darkText: 'text-emerald-400' },
    'Perdido': { label: 'Perdido', lightBg: 'bg-red-50', lightText: 'text-red-700', darkBg: 'bg-red-500/10', darkText: 'text-red-400' },
    'cold': { label: 'Frio', lightBg: 'bg-zinc-100', lightText: 'text-zinc-600', darkBg: 'bg-zinc-700', darkText: 'text-zinc-400' },
  };

  const style = stages[stage] || { label: stage, lightBg: 'bg-zinc-100', lightText: 'text-zinc-600', darkBg: 'bg-zinc-700', darkText: 'text-zinc-400' };

  return {
    label: style.label,
    bg: isDarkMode ? style.darkBg : style.lightBg,
    text: isDarkMode ? style.darkText : style.lightText,
  };
}

export default function ConversationsView({ conversations: initialConversations, tenantId }: ConversationsViewProps) {
  const { isDark: isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [conversations, setConversations] = useState(initialConversations);

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

          // Update conversation's last message
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

          // Fetch lead info for the new conversation
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

    return () => {
      supabase.removeChannel(channel);
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
          <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            Conversaciones
          </h1>
          <span className={`
            text-xs px-2 py-0.5 rounded-full font-medium
            ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}
          `}>
            {totalConversations} chats
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-48 pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none
                transition-colors duration-150
                ${isDarkMode
                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-700'
                  : 'bg-zinc-100 border border-transparent text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white'
                }
              `}
            />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={`flex items-center gap-8 pb-6 mb-6 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div>
          <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Total Chats
          </p>
          <p className={`text-xl font-semibold font-mono mt-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {totalConversations}
          </p>
        </div>

        <div className={`w-px h-8 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        <div>
          <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Activas Hoy
          </p>
          <p className={`text-xl font-semibold font-mono mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {activeToday}
          </p>
        </div>

        <div className={`w-px h-8 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        <div>
          <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Mensajes
          </p>
          <p className={`text-xl font-semibold font-mono mt-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
            {totalMessages}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={`flex items-center gap-1 p-1 rounded-lg mb-6 w-fit ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
        {[
          { key: 'all', label: 'Todas' },
          { key: 'active', label: 'Activas' },
          { key: 'archived', label: 'Archivadas' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${filter === tab.key
                ? isDarkMode
                  ? 'bg-zinc-800 text-white'
                  : 'bg-white text-zinc-900 shadow-sm'
                : isDarkMode
                  ? 'text-zinc-500 hover:text-zinc-300'
                  : 'text-zinc-500 hover:text-zinc-700'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conversation List */}
      {filteredConversations.length > 0 ? (
        <div className={`rounded-xl overflow-hidden ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
          <ul className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
            {filteredConversations.map((conversation) => {
              const stage = getStageStyle(conversation.stage, isDarkMode);
              return (
                <li key={conversation.id}>
                  <Link
                    href={`/loomi/dashboard/conversations/${conversation.id}`}
                    className={`
                      block transition-colors
                      ${isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'}
                    `}
                  >
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-11 h-11 rounded-full flex items-center justify-center text-base font-medium
                            ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}
                          `}>
                            {conversation.leadName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                {conversation.leadName}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stage.bg} ${stage.text}`}>
                                {stage.label}
                              </span>
                            </div>
                            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              {conversation.leadPhone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            {formatTimeAgo(conversation.lastMessageTime)}
                          </p>
                          <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-300'}`}>
                            {conversation.messageCount} msgs
                          </p>
                        </div>
                      </div>
                      <p className={`
                        mt-2 text-sm line-clamp-1 pl-[60px]
                        ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}
                      `}>
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
          <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            No se encontraron resultados para &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : null}

      {/* Empty State */}
      {conversations.length === 0 && (
        <div className="text-center py-20">
          <div className={`
            w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center
            ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}
          `}>
            <MessageSquare className={`w-6 h-6 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
          </div>
          <h3 className={`text-base font-medium mb-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
            Sin conversaciones
          </h3>
          <p className={`text-sm max-w-sm mx-auto ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Las conversaciones apareceran cuando tus clientes te escriban por WhatsApp
          </p>
        </div>
      )}
    </div>
  );
}
