'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Flame, PhoneForwarded, Download, PhoneOff, X, Snowflake, Bot, ThermometerSun } from 'lucide-react';
import Link from 'next/link';

type Category = 'handoff' | 'hot' | 'warm' | 'cold' | 'bot_autoresponse';

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
  category: Category;
  handoffReason: string | null;
  handoffPriority: string | null;
}

interface NoResponse {
  phone: string;
  name: string | null;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
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
    handoff: 'handoff',
    hotLead: 'hot lead',
    warmLead: 'warm',
    coldLead: 'cold',
    botAutoresponse: 'auto-reply',
    sectionHandoff: 'Needs attention',
    sectionHot: 'Hot leads',
    sectionWarm: 'Warm leads',
    sectionCold: 'Cold leads',
    sectionBot: 'Auto-responses',
    sectionNoResponse: 'No response',
    exportCsv: 'export CSV',
    noMessages: 'No messages',
    close: 'close',
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
    handoff: 'handoff',
    hotLead: 'lead caliente',
    warmLead: 'tibio',
    coldLead: 'frío',
    botAutoresponse: 'auto-respuesta',
    sectionHandoff: 'Requieren atención',
    sectionHot: 'Leads calientes',
    sectionWarm: 'Leads tibios',
    sectionCold: 'Leads fríos',
    sectionBot: 'Auto-respuestas',
    sectionNoResponse: 'Sin respuesta',
    exportCsv: 'exportar CSV',
    noMessages: 'Sin mensajes',
    close: 'cerrar',
  },
};

const handoffReasonLabels: Record<string, Record<'en' | 'es', string>> = {
  user_requested: { en: 'requested human', es: 'pidió humano' },
  user_frustrated: { en: 'frustrated', es: 'frustrado' },
  enterprise_lead: { en: 'enterprise', es: 'enterprise' },
  complex_question: { en: 'complex question', es: 'pregunta compleja' },
  negative_sentiment: { en: 'negative', es: 'negativo' },
  competitor_mention: { en: 'competitor', es: 'competidor' },
  payment_issue: { en: 'payment issue', es: 'problema de pago' },
};

const stageColors: Record<string, string> = {
  initial: 'text-muted', lead: 'text-muted', nuevo: 'text-muted',
  contactado: 'text-muted', contacted: 'text-muted',
  calificado: 'text-muted', qualified: 'text-muted',
  propuesta: 'text-muted', proposal: 'text-muted',
  negociacion: 'text-muted', negotiation: 'text-muted',
  ganado: 'text-muted', won: 'text-muted',
  perdido: 'text-terminal-red', lost: 'text-terminal-red',
  demo_scheduled: 'text-muted', closed: 'text-muted',
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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function downloadCsv(filename: string, rows: Array<{ phone: string; name: string }>) {
  const header = 'phone,name';
  const lines = rows.map(r => `"${r.phone}","${(r.name || '').replace(/"/g, '""')}"`);
  const csv = [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Chat Panel (slide-over) ──────────────────────────────────────────

function ChatPanel({ conv, lang, t, onClose }: {
  conv: Conversation;
  lang: 'en' | 'es';
  t: typeof i18n.en;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/conversations/${conv.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [conv.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border-l border-border flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
              <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
              <div className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
            </div>
            <span className="text-sm font-mono text-foreground ml-2 truncate">{conv.leadName}</span>
            <span className={`text-xs ${stageColors[conv.leadStage.toLowerCase()] || 'text-muted'}`}>
              {conv.leadStage}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-2 text-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lead info */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border text-xs font-mono text-muted">
          <span>{conv.leadPhone}</span>
          <span>{conv.messageCount} {t.messages}</span>
          {conv.category === 'handoff' && (
            <span className="text-terminal-red">
              {conv.handoffReason
                ? handoffReasonLabels[conv.handoffReason]?.[lang] || conv.handoffReason
                : t.handoff}
            </span>
          )}
          {conv.category === 'hot' && (
            <span className="text-orange-400">{t.hotLead}</span>
          )}
          {conv.category === 'warm' && (
            <span className="text-terminal-yellow">{t.warmLead}</span>
          )}
          {conv.category === 'cold' && (
            <span className="text-blue-400">{t.coldLead}</span>
          )}
          {conv.category === 'bot_autoresponse' && (
            <span className="text-muted">{t.botAutoresponse}</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-6 h-6 text-muted/40 mb-2" />
              <span className="text-xs text-muted">{t.noMessages}</span>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  msg.role === 'user'
                    ? 'bg-info/15 text-foreground rounded-br-sm'
                    : 'bg-background border border-border rounded-bl-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs text-muted mt-1">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

// ── Conversation Row ─────────────────────────────────────────────────

function ConversationRow({ conv, lang, t, onClick }: {
  conv: Conversation; lang: 'en' | 'es'; t: typeof i18n.en;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors group w-full text-left"
    >
      <div className="relative flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
          conv.category === 'handoff'
            ? 'bg-terminal-red/10 border-terminal-red/30'
            : conv.category === 'hot'
            ? 'bg-orange-500/10 border-orange-500/30'
            : conv.category === 'warm'
            ? 'bg-terminal-yellow/10 border-terminal-yellow/30'
            : conv.category === 'cold'
            ? 'bg-blue-500/10 border-blue-500/30'
            : conv.category === 'bot_autoresponse'
            ? 'bg-muted/10 border-muted/30'
            : 'bg-background border-border'
        }`}>
          <span className={`text-xs font-mono ${
            conv.category === 'handoff' ? 'text-terminal-red'
            : conv.category === 'hot' ? 'text-orange-400'
            : conv.category === 'warm' ? 'text-terminal-yellow'
            : conv.category === 'cold' ? 'text-blue-400'
            : conv.category === 'bot_autoresponse' ? 'text-muted'
            : 'text-foreground'
          }`}>
            {conv.leadName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground truncate">{conv.leadName}</span>
          <span className={`text-xs ${stageColors[conv.leadStage.toLowerCase()] || 'text-muted'}`}>
            {conv.leadStage}
          </span>
          {conv.category === 'handoff' && (
            <span className="text-xs text-terminal-red bg-terminal-red/10 px-1.5 py-0.5 rounded">
              {conv.handoffReason
                ? handoffReasonLabels[conv.handoffReason]?.[lang] || conv.handoffReason
                : t.handoff}
            </span>
          )}
          {conv.category === 'hot' && (
            <span className="text-xs text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
              {t.hotLead}
            </span>
          )}
          {conv.category === 'warm' && (
            <span className="text-xs text-terminal-yellow bg-terminal-yellow/10 px-1.5 py-0.5 rounded">
              {t.warmLead}
            </span>
          )}
          {conv.category === 'cold' && (
            <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {t.coldLead}
            </span>
          )}
          {conv.category === 'bot_autoresponse' && (
            <span className="text-xs text-muted bg-muted/10 px-1.5 py-0.5 rounded">
              {t.botAutoresponse}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted truncate max-w-[300px]">
            {conv.lastMessageRole === 'assistant' ? '← ' : '→ '}
            {conv.lastMessage}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-muted">{conv.messageCount} {t.messages}</span>
        <span className="text-xs text-muted">{timeAgo(conv.lastMessageAt, lang)}</span>
      </div>
    </button>
  );
}

// ── Section Header ───────────────────────────────────────────────────

function SectionHeader({ icon, label, count, color, onExport }: {
  icon: React.ReactNode; label: string; count: number; color: string; onExport?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className={`text-xs font-mono ${color}`}>{label}</span>
        <span className="text-xs text-muted">({count})</span>
      </div>
      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
        >
          <Download className="w-3 h-3" />
          CSV
        </button>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function BroadcastConversations({
  campaignId,
  campaignStartedAt,
  lang,
  totalSent,
}: BroadcastConversationsProps) {
  const t = i18n[lang];
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [noResponse, setNoResponse] = useState<NoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoResponse, setShowNoResponse] = useState(false);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  useEffect(() => {
    if (!campaignStartedAt) { setLoading(false); return; }

    async function fetchConversations() {
      try {
        const res = await fetch(`/api/broadcasts/${campaignId}/conversations`);
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
          setNoResponse(data.noResponse || []);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    }
    fetchConversations();
  }, [campaignId, campaignStartedAt]);

  const exportCategory = useCallback((category: string, items: Array<{ phone: string; name: string }>) => {
    downloadCsv(`broadcast-${category}.csv`, items);
  }, []);

  if (!campaignStartedAt) return null;

  const handoffs = conversations.filter(c => c.category === 'handoff');
  const hot = conversations.filter(c => c.category === 'hot');
  const warm = conversations.filter(c => c.category === 'warm');
  const cold = conversations.filter(c => c.category === 'cold');
  const botAutoresponse = conversations.filter(c => c.category === 'bot_autoresponse');
  const responseRate = totalSent > 0 ? ((conversations.length / totalSent) * 100).toFixed(1) : '0';

  return (
    <>
      <div className="rounded-2xl border border-border bg-surface overflow-hidden mt-6">
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
              <span className="text-xs font-mono text-info">
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
        ) : conversations.length === 0 && noResponse.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <MessageSquare className="w-8 h-8 text-muted/40" />
            <span className="text-sm text-muted">{t.noConversations}</span>
            <span className="text-xs text-muted/60">{t.noConversationsHint}</span>
          </div>
        ) : (
          <div>
            {handoffs.length > 0 && (
              <>
                <SectionHeader
                  icon={<PhoneForwarded className="w-3 h-3" />}
                  label={t.sectionHandoff} count={handoffs.length} color="text-terminal-red"
                  onExport={() => exportCategory('handoff', handoffs.map(c => ({ phone: c.leadPhone, name: c.leadName })))}
                />
                <div className="divide-y divide-border/50">
                  {handoffs.map(conv => (
                    <ConversationRow key={conv.id} conv={conv} lang={lang} t={t} onClick={() => setSelectedConv(conv)} />
                  ))}
                </div>
              </>
            )}

            {hot.length > 0 && (
              <>
                <SectionHeader
                  icon={<Flame className="w-3 h-3" />}
                  label={t.sectionHot} count={hot.length} color="text-orange-400"
                  onExport={() => exportCategory('hot-leads', hot.map(c => ({ phone: c.leadPhone, name: c.leadName })))}
                />
                <div className="divide-y divide-border/50">
                  {hot.map(conv => (
                    <ConversationRow key={conv.id} conv={conv} lang={lang} t={t} onClick={() => setSelectedConv(conv)} />
                  ))}
                </div>
              </>
            )}

            {warm.length > 0 && (
              <>
                <SectionHeader
                  icon={<ThermometerSun className="w-3 h-3" />}
                  label={t.sectionWarm} count={warm.length} color="text-terminal-yellow"
                  onExport={() => exportCategory('warm-leads', warm.map(c => ({ phone: c.leadPhone, name: c.leadName })))}
                />
                <div className="divide-y divide-border/50">
                  {warm.map(conv => (
                    <ConversationRow key={conv.id} conv={conv} lang={lang} t={t} onClick={() => setSelectedConv(conv)} />
                  ))}
                </div>
              </>
            )}

            {cold.length > 0 && (
              <>
                <SectionHeader
                  icon={<Snowflake className="w-3 h-3" />}
                  label={t.sectionCold} count={cold.length} color="text-blue-400"
                  onExport={() => exportCategory('cold-leads', cold.map(c => ({ phone: c.leadPhone, name: c.leadName })))}
                />
                <div className="divide-y divide-border/50">
                  {cold.map(conv => (
                    <ConversationRow key={conv.id} conv={conv} lang={lang} t={t} onClick={() => setSelectedConv(conv)} />
                  ))}
                </div>
              </>
            )}

            {botAutoresponse.length > 0 && (
              <>
                <SectionHeader
                  icon={<Bot className="w-3 h-3" />}
                  label={t.sectionBot} count={botAutoresponse.length} color="text-muted"
                  onExport={() => exportCategory('bot-autoresponse', botAutoresponse.map(c => ({ phone: c.leadPhone, name: c.leadName })))}
                />
                <div className="divide-y divide-border/50">
                  {botAutoresponse.map(conv => (
                    <ConversationRow key={conv.id} conv={conv} lang={lang} t={t} onClick={() => setSelectedConv(conv)} />
                  ))}
                </div>
              </>
            )}

            {noResponse.length > 0 && (
              <>
                <SectionHeader
                  icon={<PhoneOff className="w-3 h-3" />}
                  label={t.sectionNoResponse} count={noResponse.length} color="text-muted"
                  onExport={() => exportCategory('no-response', noResponse.map(r => ({ phone: r.phone, name: r.name || '' })))}
                />
                <div>
                  <button
                    onClick={() => setShowNoResponse(!showNoResponse)}
                    className="w-full px-4 py-2 text-xs font-mono text-muted hover:text-foreground transition-colors text-left"
                  >
                    {showNoResponse ? '▼' : '▶'} {noResponse.length} {lang === 'es' ? 'contactos sin respuesta' : 'contacts without response'}
                  </button>
                  {showNoResponse && (
                    <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
                      {noResponse.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2">
                          <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-muted">{(r.name || '?').charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-xs text-muted">{r.name || '-'}</span>
                          <span className="text-xs font-mono text-muted/60">{r.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        {conversations.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border">
            <Link href="/dashboard/conversations" className="text-xs font-mono text-muted hover:text-foreground transition-colors">
              {t.viewInbox} →
            </Link>
            <button
              onClick={() => exportCategory('all-responses', conversations.map(c => ({ phone: c.leadPhone, name: c.leadName })))}
              className="flex items-center gap-1 text-xs font-mono text-muted hover:text-foreground transition-colors"
            >
              <Download className="w-3 h-3" />
              {t.exportCsv}
            </button>
          </div>
        )}
      </div>

      {/* Chat Panel */}
      {selectedConv && (
        <ChatPanel conv={selectedConv} lang={lang} t={t} onClose={() => setSelectedConv(null)} />
      )}
    </>
  );
}
