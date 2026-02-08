'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, User, Building, Mail, Tag, Send, Play, PauseCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  stage: string;
  industry: string | null;
}

interface ConversationDetailViewProps {
  conversation: {
    id: string;
    started_at: string;
    ended_at: string | null;
    summary: string | null;
    bot_paused: boolean;
  };
  lead: Lead;
  messages: Message[];
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStageStyle(stage: string): { label: string; bg: string; text: string } {
  const stages: Record<string, { label: string; bg: string; text: string }> = {
    'Nuevo': { label: 'Nuevo', bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' },
    'initial': { label: 'Nuevo', bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' },
    'Contactado': { label: 'Contactado', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
    'qualified': { label: 'Calificado', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
    'Calificado': { label: 'Calificado', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
    'Demo Agendada': { label: 'Demo Agendada', bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' },
    'demo_scheduled': { label: 'Demo Agendada', bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' },
    'Propuesta': { label: 'Propuesta', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
    'Negociacion': { label: 'Negociacion', bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' },
    'Ganado': { label: 'Ganado', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
    'customer': { label: 'Cliente', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
    'Perdido': { label: 'Perdido', bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
    'cold': { label: 'Frio', bg: 'bg-zinc-500/10', text: 'text-muted' },
  };

  const style = stages[stage] || { label: stage, bg: 'bg-zinc-500/10', text: 'text-muted' };
  return style;
}

export default function ConversationDetailView({ conversation, lead, messages: initialMessages }: ConversationDetailViewProps) {
  const stage = getStageStyle(lead.stage);
  const [messages, setMessages] = useState(initialMessages);
  const [botPaused, setBotPaused] = useState(conversation.bot_paused);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [resuming, setResuming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription for new messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  async function handleSendReply() {
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      if (res.ok) {
        setReplyText('');
        setBotPaused(true);
      }
    } catch (error) {
      console.error('Reply error:', error);
    } finally {
      setSending(false);
    }
  }

  async function handleResumeBot() {
    setResuming(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/resume`, {
        method: 'POST',
      });

      if (res.ok) {
        setBotPaused(false);
      }
    } catch (error) {
      console.error('Resume error:', error);
    } finally {
      setResuming(false);
    }
  }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/conversations"
            className="p-2 rounded-xl transition-colors hover:bg-surface-2 text-muted hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              {lead.name}
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stage.bg} ${stage.text}`}>
              {stage.label}
            </span>
            {botPaused && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400">
                bot pausado
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {botPaused && (
            <button
              onClick={handleResumeBot}
              disabled={resuming}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium font-mono transition-colors duration-150 bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {resuming ? 'Reactivando...' : 'Reactivar bot'}
            </button>
          )}
          <a
            href={`https://wa.me/${lead.phone.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors duration-150 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-8 pb-6 mb-6 border-b border-border">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Mensajes
          </p>
          <p className="text-xl font-semibold font-mono mt-1 text-foreground">
            {messages.length}
          </p>
        </div>

        <div className="w-px h-8 bg-border" />

        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Iniciada
          </p>
          <p className="text-sm font-medium mt-1 text-muted-foreground">
            {formatDate(conversation.started_at)}
          </p>
        </div>

        <div className="w-px h-8 bg-border" />

        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Telefono
          </p>
          <p className="text-sm font-medium mt-1 text-muted-foreground">
            {lead.phone}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages + Reply Input */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden bg-surface border border-border">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted" />
                <h2 className="font-medium text-sm text-foreground">
                  Historial de mensajes
                </h2>
              </div>
              {botPaused && (
                <div className="flex items-center gap-1.5">
                  <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-mono text-amber-500">
                    bot pausado - respondiendo manualmente
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 h-[400px] overflow-y-auto space-y-3 bg-background/50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-2xl px-4 py-2.5
                      ${message.role === "assistant"
                        ? 'bg-surface-2 border border-border rounded-bl-sm'
                        : 'bg-emerald-600 text-white rounded-br-sm'
                      }
                    `}
                  >
                    <p className={`text-sm whitespace-pre-wrap ${
                      message.role === "assistant"
                        ? 'text-foreground'
                        : 'text-white'
                    }`}>
                      {message.content}
                    </p>
                    <p className={`text-xs mt-1 ${
                      message.role === "assistant"
                        ? 'text-muted'
                        : 'text-emerald-200'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}

              {messages.length === 0 && (
                <div className="text-center py-12 text-muted">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay mensajes en esta conversacion</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            <div className="px-4 py-3 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  disabled={sending}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-mono outline-none transition-colors bg-background border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sending}
                  className="p-2 rounded-xl transition-colors bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs mt-1.5 font-mono text-muted">
                {botPaused
                  ? 'Bot pausado. Tus mensajes se envian directo al WhatsApp del lead.'
                  : 'Al enviar, el bot se pausa automaticamente.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Lead Info Sidebar */}
        <div className="space-y-4">
          {/* Contact Card */}
          <div className="rounded-2xl p-5 bg-surface border border-border">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium bg-surface-2 text-muted">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium text-foreground">{lead.name}</h3>
                <p className="text-sm text-muted">{lead.phone}</p>
              </div>
            </div>

            <dl className="space-y-4">
              {lead.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-0.5 text-muted" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">Email</dt>
                    <dd className="text-sm mt-0.5 text-muted-foreground">{lead.email}</dd>
                  </div>
                </div>
              )}
              {lead.company && (
                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 mt-0.5 text-muted" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">Empresa</dt>
                    <dd className="text-sm mt-0.5 text-muted-foreground">{lead.company}</dd>
                  </div>
                </div>
              )}
              {lead.industry && (
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 mt-0.5 text-muted" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">Industria</dt>
                    <dd className="text-sm mt-0.5 text-muted-foreground">{lead.industry}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Summary Card */}
          {conversation.summary && (
            <div className="rounded-2xl p-5 bg-surface border border-border">
              <h3 className="font-medium text-sm mb-3 text-foreground">
                Resumen
              </h3>
              <p className="text-sm text-muted">
                {conversation.summary}
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-2xl p-5 bg-surface border border-border">
            <h3 className="font-medium text-sm mb-3 text-foreground">
              Acciones rapidas
            </h3>
            <div className="space-y-2">
              <Link
                href={`/dashboard/crm`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors w-full text-muted hover:text-foreground hover:bg-surface-2"
              >
                <User className="w-4 h-4" />
                Ver en Pipeline
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
