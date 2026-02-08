'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SendHorizontal, RotateCcw, User, Bot, Loader2, ChevronDown, Sparkles, FileText, Settings2 } from 'lucide-react';
import { SandboxToolsPanel } from './SandboxToolsPanel';
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
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);
  const [toolsVersion, setToolsVersion] = useState(0); // Increment to refresh
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
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col bg-background">
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        {/* Left: Terminal dots + Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-terminal-red" />
            <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
            <div className="w-3 h-3 rounded-full bg-terminal-green" />
          </div>
          <span className="text-sm font-mono text-muted">demo</span>
        </div>

        {/* Right: Tools + Reset */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsToolsPanelOpen(true)}
            className="text-muted hover:text-foreground hover:bg-surface-2 h-8 px-3"
          >
            <Settings2 className="mr-2 h-3.5 w-3.5" />
            <span className="text-xs">tools</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetConversation}
            className="text-muted hover:text-foreground hover:bg-surface-2 h-8 px-3"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            <span className="text-xs">reset</span>
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-2 px-4 py-2.5">
        {/* Tenant Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-border text-sm text-foreground hover:border-muted transition-colors">
              <span className="truncate max-w-[180px] font-medium">
                {selectedTenant?.businessName || selectedTenant?.name || 'Seleccionar agente'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[260px] bg-surface border-border">
            {tenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => {
                  setSelectedTenant(tenant);
                  setUseCustomPrompt(false);
                  resetConversation();
                }}
                className="flex flex-col items-start gap-0.5 hover:bg-surface-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {tenant.businessName || tenant.name}
                  </span>
                  {tenant.hasCustomPrompt && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-terminal-green/10 text-terminal-green rounded">
                      custom
                    </span>
                  )}
                </div>
                {tenant.companyName && (
                  <span className="text-xs text-muted">
                    {tenant.companyName}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Prompt Selector */}
        {selectedTenant?.hasCustomPrompt && (
          <div className="flex items-center gap-1 p-0.5 rounded-md bg-surface border border-border">
            <button
              onClick={() => setUseCustomPrompt(false)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
                !useCustomPrompt
                  ? 'bg-foreground text-background'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <FileText className="h-3 w-3" />
              default
            </button>
            <button
              onClick={() => setUseCustomPrompt(true)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
                useCustomPrompt
                  ? 'bg-terminal-green text-background'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <Sparkles className="h-3 w-3" />
              custom
            </button>
          </div>
        )}

        {/* Lead Name Input */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="nombre (opcional)"
            value={leadName}
            onChange={(e) => setLeadName(e.target.value)}
            className="h-8 w-36 bg-surface border-border text-foreground text-sm placeholder:text-muted font-mono"
          />
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-background" viewportRef={scrollRef}>
        <div className="flex flex-col gap-4 p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                <Bot className="h-7 w-7 text-muted" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-medium text-foreground">
                  Demo
                </h3>
                <p className="max-w-sm text-sm text-muted">
                  Prueba el agente de {selectedTenant?.businessName || 'seguros'} en tiempo real.
                </p>
                {selectedTenant?.hasCustomPrompt && (
                  <p className="text-xs font-mono text-muted">
                    prompt: {useCustomPrompt ? (
                      <span className="text-terminal-green">custom</span>
                    ) : (
                      <span className="text-foreground">default</span>
                    )}
                  </p>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(suggestion)}
                    disabled={isLoading}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-muted hover:text-foreground disabled:opacity-50 font-mono"
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 border border-border">
                    <Bot className="h-4 w-4 text-muted" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3 text-sm',
                    message.role === 'user'
                      ? 'bg-foreground text-background'
                      : 'bg-surface border border-border text-foreground'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <span className={cn(
                    "mt-1.5 block text-[10px] font-mono",
                    message.role === 'user' ? 'text-background/50' : 'text-muted'
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 border border-border">
                    <User className="h-4 w-4 text-muted" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Thinking Indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 border border-border">
                <Bot className="h-4 w-4 text-muted" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-surface border border-border px-4 py-3 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-terminal-green" />
                <span className="font-mono text-xs">thinking...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex justify-center">
              <div className="rounded-2xl bg-terminal-red/10 border border-terminal-red/20 px-4 py-2 text-sm text-terminal-red font-mono">
                {error}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-surface p-4"
      >
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2">
          <span className="text-terminal-green font-mono text-sm">$</span>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="escribe un mensaje..."
            disabled={isLoading}
            className="flex-1 border-0 bg-transparent text-foreground text-sm placeholder:text-muted focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-8 w-8 shrink-0 rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted font-mono">
          rate limit: 10 msg/min • demo mode
        </p>
      </form>

      {/* Tools Panel */}
      <SandboxToolsPanel
        isOpen={isToolsPanelOpen}
        onClose={() => setIsToolsPanelOpen(false)}
        tenantId={selectedTenant?.id}
        onUpdate={() => setToolsVersion(v => v + 1)}
      />
    </div>
  );
}
