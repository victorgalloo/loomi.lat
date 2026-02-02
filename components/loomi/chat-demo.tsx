'use client';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCheck, Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  time: string;
}

// Suggestion chips for quick start
const SUGGESTIONS = [
  'Hola, quiero info',
  '¿Cuánto cuesta?',
  '¿Cómo funciona?'
];

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'bot',
      text: 'Hola, gracias por escribir. ¿Buscas automatizar tus ventas por WhatsApp?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/sandbox/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          sessionId,
          tenantId: 'demo',
          history: [...messages, userMessage].map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.text,
            timestamp: new Date().toISOString()
          }))
        })
      });

      const data = await res.json();

      if (res.ok && data.response) {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          text: data.response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, sessionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Terminal-style chat container */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-elevated">
        {/* Terminal header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface-2">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-terminal-red" />
            <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
            <div className="w-3 h-3 rounded-full bg-terminal-green" />
          </div>
          <span className="text-xs text-muted font-mono ml-2">loomi — interactive</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-terminal-green" />
            <span className="text-xs text-muted font-mono">online</span>
          </div>
        </div>

        {/* Chat area */}
        <div
          ref={scrollRef}
          className="h-[350px] p-4 overflow-y-auto bg-background"
        >
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'flex',
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-lg px-4 py-3 max-w-[85%] font-mono text-sm',
                      message.type === 'user'
                        ? 'bg-foreground text-background'
                        : 'bg-surface-2 border border-border text-foreground'
                    )}
                  >
                    <p className="leading-relaxed">{message.text}</p>
                    <div className={cn(
                      'flex items-center gap-1 mt-1.5',
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}>
                      <span className={cn(
                        'text-[10px]',
                        message.type === 'user' ? 'opacity-50' : 'text-muted'
                      )}>
                        {message.time}
                      </span>
                      {message.type === 'user' && (
                        <CheckCheck className="w-3 h-3 opacity-50" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-surface-2 rounded-lg px-4 py-3 border border-border">
                    <div className="flex gap-1.5 items-center">
                      <Loader2 className="w-3.5 h-3.5 text-terminal-green animate-spin" />
                      <span className="text-xs text-muted font-mono">thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Suggestions (only when few messages) */}
            {messages.length <= 1 && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2 pt-2"
              >
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="px-3 py-1.5 text-xs font-mono text-muted border border-border rounded-md hover:border-muted hover:text-foreground transition-colors bg-surface"
                  >
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-surface-2">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="$ escribe un mensaje..."
              disabled={isLoading}
              className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm placeholder-muted focus:outline-none focus:border-muted transition-colors font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 rounded-lg bg-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-background animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-background" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
