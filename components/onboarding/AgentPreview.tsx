'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentPreviewProps {
  tenantId: string;
  industry?: string;
  businessName?: string;
  businessDescription?: string;
  productsServices?: string;
  customInstructions?: string;
  tone?: string;
  customSystemPrompt?: string;
}

const QUICK_TESTS = [
  '¿Cuánto cuesta?',
  '¿Qué ofrecen?',
  'Quiero agendar',
];

export function AgentPreview({
  tenantId,
  industry,
  businessName,
  businessDescription,
  productsServices,
  customInstructions,
  tone,
  customSystemPrompt,
}: AgentPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/onboarding/test-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          industry,
          businessName,
          businessDescription,
          productsServices,
          customInstructions,
          tone,
          customSystemPrompt,
          conversationHistory: messages,
        }),
      });

      const data = await res.json();
      if (data.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono text-muted">chat_preview</span>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-muted hover:text-foreground"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="text-xs text-muted mb-3">Prueba rápida:</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_TESTS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-2.5 py-1 text-xs font-mono bg-surface border border-border rounded hover:border-foreground/30 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-1.5 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-foreground text-background'
                    : 'bg-surface border border-border'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border px-3 py-1.5 rounded-lg">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse delay-75" />
                <span className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse delay-150" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe algo..."
          className="flex-1 px-3 py-1.5 bg-surface border border-border rounded text-sm font-mono focus:outline-none focus:border-foreground/30"
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          className="px-3 py-1.5 bg-foreground text-background rounded text-sm disabled:opacity-30"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
