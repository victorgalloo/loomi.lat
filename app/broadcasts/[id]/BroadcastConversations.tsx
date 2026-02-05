'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface Conversation {
  id: string;
  leadName: string;
  leadPhone: string;
  leadStage: string;
  messageCount: number;
  lastMessage: string;
  lastMessageRole: string;
  startedAt: string;
  lastMessageAt: string;
}

interface BroadcastConversationsProps {
  campaignId: string;
  campaignStartedAt: string | null;
  lang: 'en' | 'es';
  totalSent: number;
}

const i18n = {
  en: {
    title: './conversations_',
    responseRate: 'response rate',
    responses: 'responses',
    of: 'of',
    sent: 'sent',
    noConversations: 'No responses yet',
    noConversationsHint: 'Conversations will appear here when recipients reply',
    messages: 'msgs',
    viewInbox: 'open inbox',
  },
  es: {
    title: './conversaciones_',
    responseRate: 'tasa de respuesta',
    responses: 'respuestas',
    of: 'de',
    sent: 'enviados',
    noConversations: 'Sin respuestas aún',
    noConversationsHint: 'Las conversaciones aparecerán cuando los destinatarios respondan',
    messages: 'msgs',
    viewInbox: 'abrir inbox',
  },
};

const stageColors: Record<string, string> = {
  initial: 'text-muted',
  contacted: 'text-terminal-yellow',
  qualified: 'text-terminal-green',
  demo_scheduled: 'text-terminal-green',
  closed: 'text-terminal-green',
  lost: 'text-terminal-red',
};

function timeAgo(dateStr: string, lang: 'en' | 'es'): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return lang === 'es' ? 'ahora' : 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

export default function BroadcastConversations({
  campaignId,
  campaignStartedAt,
  lang,
  totalSent,
}: BroadcastConversationsProps) {
  const t = i18n[lang];
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignStartedAt) {
      setLoading(false);
      return;
    }

    async function fetchConversations() {
      try {
        const res = await fetch(`/api/broadcasts/${campaignId}/conversations`);
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, [campaignId, campaignStartedAt]);

  if (!campaignStartedAt) return null;

  const responseRate = totalSent > 0 ? ((conversations.length / totalSent) * 100).toFixed(1) : '0';

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden mt-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-terminal-red" />
            <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
            <div className="w-3 h-3 rounded-full bg-terminal-green" />
          </div>
          <span className="text-sm font-mono text-foreground ml-2">{t.title}</span>
        </div>
        {!loading && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted">
              {conversations.length} {t.responses} {t.of} {totalSent} {t.sent}
            </span>
            <span className="text-xs font-mono text-terminal-green">
              {responseRate}% {t.responseRate}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <MessageSquare className="w-8 h-8 text-muted/40" />
          <span className="text-sm text-muted font-mono">{t.noConversations}</span>
          <span className="text-xs text-muted/60 font-mono">{t.noConversationsHint}</span>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/dashboard/conversations?id=${conv.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors group"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-mono text-foreground">
                  {conv.leadName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground truncate">
                    {conv.leadName}
                  </span>
                  <span className={`text-[10px] font-mono ${stageColors[conv.leadStage] || 'text-muted'}`}>
                    {conv.leadStage}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-muted truncate max-w-[300px]">
                    {conv.lastMessageRole === 'assistant' ? '← ' : '→ '}
                    {conv.lastMessage}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[10px] font-mono text-muted">
                  {conv.messageCount} {t.messages}
                </span>
                <span className="text-[10px] font-mono text-muted">
                  {timeAgo(conv.lastMessageAt, lang)}
                </span>
                <ArrowUpRight className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer link */}
      {conversations.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <Link
            href="/dashboard/conversations"
            className="text-xs font-mono text-muted hover:text-foreground transition-colors"
          >
            {t.viewInbox} →
          </Link>
        </div>
      )}
    </div>
  );
}
