'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, User, Building, Mail, Tag, Send, Play, PauseCircle, Paperclip, X, FileText, Image as ImageIcon, Video } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
  media_url?: string | null;
  media_type?: string | null;
  media_filename?: string | null;
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

interface ConversationData {
  id: string;
  started_at: string;
  ended_at: string | null;
  summary: string | null;
  bot_paused: boolean;
}

export interface ConversationDetailViewProps {
  conversation: ConversationData;
  lead: Lead;
  messages: Message[];
  /** When true, renders as embedded panel (no padding, no back link) */
  embedded?: boolean;
  /** Callback when back button is pressed (mobile) */
  onBack?: () => void;
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStageStyle(stage: string): { label: string; bg: string; text: string } {
  const stages: Record<string, { label: string; bg: string; text: string }> = {
    'Cold': { label: 'Cold', bg: 'bg-info/10', text: 'text-info' },
    'Warm': { label: 'Warm', bg: 'bg-terminal-yellow/10', text: 'text-terminal-yellow' },
    'Hot': { label: 'Hot', bg: 'bg-warning/10', text: 'text-warning' },
    'Ganado': { label: 'Ganado', bg: 'bg-terminal-green/10', text: 'text-terminal-green' },
    'Perdido': { label: 'Perdido', bg: 'bg-surface-2', text: 'text-muted' },
    'Nuevo': { label: 'Cold', bg: 'bg-info/10', text: 'text-info' },
    'initial': { label: 'Cold', bg: 'bg-info/10', text: 'text-info' },
    'Contactado': { label: 'Warm', bg: 'bg-terminal-yellow/10', text: 'text-terminal-yellow' },
    'qualified': { label: 'Hot', bg: 'bg-warning/10', text: 'text-warning' },
    'Calificado': { label: 'Hot', bg: 'bg-warning/10', text: 'text-warning' },
    'Demo Agendada': { label: 'Hot', bg: 'bg-warning/10', text: 'text-warning' },
    'demo_scheduled': { label: 'Hot', bg: 'bg-warning/10', text: 'text-warning' },
    'Propuesta': { label: 'Hot', bg: 'bg-warning/10', text: 'text-warning' },
    'Negociacion': { label: 'Hot', bg: 'bg-warning/10', text: 'text-warning' },
    'customer': { label: 'Ganado', bg: 'bg-terminal-green/10', text: 'text-terminal-green' },
    'cold': { label: 'Cold', bg: 'bg-info/10', text: 'text-info' },
  };
  return stages[stage] || { label: stage, bg: 'bg-surface-2', text: 'text-muted' };
}

// Attachment preview component
function AttachmentPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border">
      {preview ? (
        <img src={preview} alt={file.name} className="w-10 h-10 rounded object-cover" />
      ) : file.type.startsWith('video/') ? (
        <Video className="w-5 h-5 text-muted" />
      ) : (
        <FileText className="w-5 h-5 text-muted" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground truncate">{file.name}</p>
        <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</p>
      </div>
      <button onClick={onRemove} className="p-1 rounded hover:bg-surface-2 text-muted hover:text-foreground">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Message media renderer
function MessageMedia({ message }: { message: Message }) {
  if (!message.media_url || !message.media_type) return null;

  if (message.media_type === 'image') {
    return (
      <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img
          src={message.media_url}
          alt={message.media_filename || 'Image'}
          className="max-w-[240px] rounded-lg"
          loading="lazy"
        />
      </a>
    );
  }

  if (message.media_type === 'video') {
    return (
      <video
        src={message.media_url}
        controls
        className="max-w-[240px] rounded-lg mt-1"
        preload="metadata"
      />
    );
  }

  // Document
  return (
    <a
      href={message.media_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg bg-background/20 hover:bg-background/30 transition-colors"
    >
      <FileText className="w-4 h-4 flex-shrink-0" />
      <span className="text-xs truncate">{message.media_filename || 'Documento'}</span>
    </a>
  );
}

export default function ConversationDetailView({
  conversation,
  lead,
  messages: initialMessages,
  embedded = false,
  onBack,
}: ConversationDetailViewProps) {
  const stage = getStageStyle(lead.stage);
  const [messages, setMessages] = useState(initialMessages);
  const [botPaused, setBotPaused] = useState(conversation.bot_paused);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showLeadInfo, setShowLeadInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync messages from props when conversation changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Sync bot paused state
  useEffect(() => {
    setBotPaused(conversation.bot_paused);
  }, [conversation.bot_paused]);

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

  const handleSendReply = useCallback(async () => {
    if ((!replyText.trim() && !attachment) || sending) return;

    setSending(true);
    try {
      if (attachment) {
        // Send attachment
        const formData = new FormData();
        formData.append('file', attachment);
        if (replyText.trim()) formData.append('caption', replyText.trim());

        const res = await fetch(`/api/conversations/${conversation.id}/attachment`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          setReplyText('');
          setAttachment(null);
          setBotPaused(true);
        }
      } else {
        // Send text
        const res = await fetch(`/api/conversations/${conversation.id}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: replyText.trim() }),
        });

        if (res.ok) {
          setReplyText('');
          setBotPaused(true);
        }
      }
    } catch (error) {
      console.error('Reply error:', error);
    } finally {
      setSending(false);
    }
  }, [replyText, attachment, sending, conversation.id]);

  async function handleResumeBot() {
    setResuming(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/resume`, {
        method: 'POST',
      });
      if (res.ok) setBotPaused(false);
    } catch (error) {
      console.error('Resume error:', error);
    } finally {
      setResuming(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      alert('Archivo muy grande (máx 16MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no soportado');
      return;
    }

    setAttachment(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  }

  return (
    <div className={`flex flex-col h-full ${embedded ? '' : 'px-6 py-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Back button for mobile or standalone */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg transition-colors hover:bg-surface-2 text-muted hover:text-foreground lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-info-muted text-info border border-border flex-shrink-0">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground">{lead.name}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ${stage.bg} ${stage.text}`}>
                {stage.label}
              </span>
              {botPaused && (
                <span className="px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-terminal-yellow/10 text-terminal-yellow">
                  bot pausado
                </span>
              )}
            </div>
            <p className="text-xs text-muted font-mono">{lead.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {botPaused && (
            <button
              onClick={handleResumeBot}
              disabled={resuming}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors bg-info/10 text-info hover:bg-info/20 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {resuming ? '...' : 'Reactivar'}
            </button>
          )}
          <button
            onClick={() => setShowLeadInfo(!showLeadInfo)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${showLeadInfo ? 'bg-foreground text-background' : 'text-muted hover:text-foreground hover:bg-surface-2'}`}
          >
            <User className="w-4 h-4" />
          </button>
          <a
            href={`https://wa.me/${lead.phone.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-xs transition-colors text-muted hover:text-foreground hover:bg-surface-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 min-h-0">
        {/* Messages area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Bot paused indicator */}
          {botPaused && (
            <div className="flex items-center justify-center gap-1.5 py-1.5 bg-terminal-yellow/5 border-b border-terminal-yellow/10">
              <PauseCircle className="w-3 h-3 text-terminal-yellow" />
              <span className="text-[11px] text-terminal-yellow">
                bot pausado - respondiendo manualmente
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`
                    max-w-[75%] rounded-2xl px-3.5 py-2
                    ${message.role === "assistant"
                      ? 'bg-surface-2 border border-border rounded-bl-sm'
                      : 'bg-info text-white rounded-br-sm'
                    }
                  `}
                >
                  <MessageMedia message={message} />
                  {message.content && (
                    <p className={`text-sm whitespace-pre-wrap ${
                      message.role === "assistant" ? 'text-foreground' : 'text-white'
                    }`}>
                      {message.content}
                    </p>
                  )}
                  <p className={`text-[10px] mt-0.5 ${
                    message.role === "assistant" ? 'text-muted' : 'text-white/50'
                  }`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-12 text-muted">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay mensajes en esta conversación</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attachment preview */}
          {attachment && (
            <div className="px-4 pb-1">
              <AttachmentPreview file={attachment} onRemove={() => setAttachment(null)} />
            </div>
          )}

          {/* Reply input */}
          <div className="px-4 py-3 border-t border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="p-2 rounded-lg transition-colors text-muted hover:text-foreground hover:bg-surface-2 disabled:opacity-50"
              >
                <Paperclip className="w-4 h-4" />
              </button>
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
                placeholder={attachment ? "Agregar caption..." : "Escribe un mensaje..."}
                disabled={sending}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-colors bg-background border border-border text-foreground placeholder:text-muted focus:ring-2 focus:ring-info/30 focus:border-info/50 disabled:opacity-50"
              />
              <button
                onClick={handleSendReply}
                disabled={(!replyText.trim() && !attachment) || sending}
                className="p-2 rounded-lg transition-colors bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Lead info side panel */}
        {showLeadInfo && (
          <div className="w-64 border-l border-border overflow-y-auto p-4 flex-shrink-0 hidden lg:block">
            {/* Contact */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-surface-2 text-muted flex-shrink-0">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">{lead.name}</h3>
                <p className="text-xs text-muted font-mono">{lead.phone}</p>
              </div>
            </div>

            <dl className="space-y-3 pb-4 mb-4 border-b border-border">
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <span className="text-xs text-muted truncate">{lead.email}</span>
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <span className="text-xs text-muted">{lead.company}</span>
                </div>
              )}
              {lead.industry && (
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <span className="text-xs text-muted">{lead.industry}</span>
                </div>
              )}
            </dl>

            {conversation.summary && (
              <div className="pb-4 mb-4 border-b border-border">
                <h4 className="font-medium text-xs mb-1.5 text-foreground">Resumen</h4>
                <p className="text-xs text-muted">{conversation.summary}</p>
              </div>
            )}

            <Link
              href="/dashboard/crm"
              className="flex items-center gap-2 py-1.5 text-xs transition-colors text-muted hover:text-foreground"
            >
              <User className="w-3.5 h-3.5" />
              Ver en Pipeline
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
