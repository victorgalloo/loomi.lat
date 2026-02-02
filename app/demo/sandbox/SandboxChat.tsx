'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SendHorizontal, RotateCcw, User, Bot, Loader2, ChevronDown, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { SandboxTenant } from '@/app/api/sandbox/tenants/route';
import type { SandboxChatRequest, SandboxChatResponse } from '@/app/api/sandbox/chat/route';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STORAGE_KEY = 'sandbox_chat_state';

interface StoredState {
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  sessionId: string;
  tenantId: string;
  leadName: string;
  useCustomPrompt: boolean;
}

// Suggestion chips for quick start
const SUGGESTIONS = [
  'Hola, quiero información',
  '¿Cuánto cuesta el seguro?',
  'Tengo 35 años',
  'No fumo'
];

export function SandboxChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenants, setTenants] = useState<SandboxTenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<SandboxTenant | null>(null);
  const [leadName, setLeadName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate session ID on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const state: StoredState = JSON.parse(stored);
        setSessionId(state.sessionId);
        setLeadName(state.leadName);
        setUseCustomPrompt(state.useCustomPrompt ?? false);
        setMessages(state.messages.map((m, i) => ({
          id: `restored-${i}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp)
        })));
        // Tenant will be set after tenants are loaded
      } catch {
        setSessionId(crypto.randomUUID());
      }
    } else {
      setSessionId(crypto.randomUUID());
    }
  }, []);

  // Fetch tenants on mount
  useEffect(() => {
    async function fetchTenants() {
      try {
        const res = await fetch('/api/sandbox/tenants');
        const data = await res.json();
        if (data.tenants && data.tenants.length > 0) {
          setTenants(data.tenants);
          // Restore tenant from storage or use first
          const stored = sessionStorage.getItem(STORAGE_KEY);
          if (stored) {
            const state: StoredState = JSON.parse(stored);
            const found = data.tenants.find((t: SandboxTenant) => t.id === state.tenantId);
            setSelectedTenant(found || data.tenants[0]);
          } else {
            setSelectedTenant(data.tenants[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
        // Set default demo tenant
        const defaultTenant: SandboxTenant = {
          id: 'demo',
          name: 'Sofi (Seguros)',
          companyName: 'NetBrokrs',
          businessName: 'NetBrokrs Seguros',
          tone: 'friendly',
          hasCustomPrompt: false,
          customPromptPreview: null
        };
        setTenants([defaultTenant]);
        setSelectedTenant(defaultTenant);
      }
    }
    fetchTenants();
  }, []);

  // Save state to sessionStorage
  useEffect(() => {
    if (!sessionId) return;
    const state: StoredState = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString()
      })),
      sessionId,
      tenantId: selectedTenant?.id || 'demo',
      leadName,
      useCustomPrompt
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [messages, sessionId, selectedTenant, leadName, useCustomPrompt]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const request: SandboxChatRequest = {
        message: messageText.trim(),
        tenantId: selectedTenant?.id,
        sessionId,
        leadName: leadName || undefined,
        useCustomPrompt: useCustomPrompt && selectedTenant?.hasCustomPrompt,
        history: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString()
        }))
      };

      const res = await fetch('/api/sandbox/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const data: SandboxChatResponse = await res.json();

      if (!res.ok) {
        throw new Error((data as unknown as { error: string }).error || 'Failed to send message');
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show escalation notice if triggered
      if (data.escalatedToHuman) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ [Demo] El agente escaló a un humano: ${data.escalatedToHuman!.reason}`,
            timestamp: new Date()
          }]);
        }, 500);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar mensaje');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, selectedTenant, sessionId, leadName, useCustomPrompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setSessionId(crypto.randomUUID());
    sessionStorage.removeItem(STORAGE_KEY);
    setError(null);
    // Keep useCustomPrompt setting when resetting conversation
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      {/* Header with controls */}
      <div className="flex flex-col gap-4 border-b border-white/20 bg-white/5 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {/* Tenant Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="justify-between gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <span className="truncate max-w-[200px]">
                  {selectedTenant?.businessName || selectedTenant?.name || 'Seleccionar agente'}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px]">
              {tenants.map((tenant) => (
                <DropdownMenuItem
                  key={tenant.id}
                  onClick={() => {
                    setSelectedTenant(tenant);
                    setUseCustomPrompt(false); // Reset to default when changing tenant
                    resetConversation();
                  }}
                  className="flex flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {tenant.businessName || tenant.name}
                    </span>
                    {tenant.hasCustomPrompt && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  {tenant.companyName && (
                    <span className="text-xs text-muted-foreground">
                      {tenant.companyName}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Prompt Selector */}
          {selectedTenant?.hasCustomPrompt && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseCustomPrompt(false)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  !useCustomPrompt
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Default
              </button>
              <button
                onClick={() => setUseCustomPrompt(true)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  useCustomPrompt
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Custom
              </button>
            </div>
          )}

          {/* Lead Name Input */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Tu nombre (opcional)"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              className="h-9 w-40 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={resetConversation}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Nueva conversación
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" viewportRef={scrollRef}>
        <div className="flex flex-col gap-4 p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  Sandbox de Demo
                </h3>
                <p className="max-w-md text-sm text-white/70">
                  Prueba el agente de {selectedTenant?.businessName || 'seguros'} en tiempo real.
                  Los mensajes no se guardan permanentemente.
                </p>
                {selectedTenant?.hasCustomPrompt && (
                  <p className="text-xs text-white/50">
                    Prompt: {useCustomPrompt ? (
                      <span className="text-emerald-400">Custom</span>
                    ) : (
                      <span className="text-white/70">Default (Seguros)</span>
                    )}
                  </p>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(suggestion)}
                    disabled={isLoading}
                    className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white/10 text-white border border-white/10'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <span className="mt-1 block text-[10px] opacity-50">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Thinking Indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/70 border border-white/10">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Escribiendo...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex justify-center">
              <div className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-200 border border-red-500/30">
                {error}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/20 bg-white/5 p-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            disabled={isLoading}
            className="flex-1 border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-10 w-10 shrink-0 rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-white/40">
          Máximo 10 mensajes por minuto • Sandbox de demostración
        </p>
      </form>
    </div>
  );
}
