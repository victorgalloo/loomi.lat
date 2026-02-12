'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, ArrowUp, Phone } from 'lucide-react';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20hablar%20con%20alguien';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const WELCOME_MESSAGE: Message = {
  id: 0,
  role: 'assistant',
  text: '¡Hola! 👋 Soy el asistente de Loomi. ¿En qué puedo ayudarte?',
};

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.text,
    }));

    try {
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: res.ok && data.response ? data.response : 'Error de conexión. Intenta de nuevo.',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Error de conexión. Intenta de nuevo.',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Collapsed bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
            aria-label="Abrir chat"
          >
            <MessageCircle className="w-6 h-6" />
            {/* Green pulsing dot */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-terminal-green border-2 border-background">
              <span className="absolute inset-0 rounded-full bg-terminal-green animate-ping opacity-75" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-40 w-80 sm:w-96 h-[28rem] flex flex-col bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
              </div>
              <span className="text-xs text-muted font-mono ml-1">loomi_chat</span>
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto p-1 rounded-md hover:bg-surface transition-colors text-muted hover:text-foreground"
                aria-label="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-foreground text-background'
                        : 'bg-surface-2 border border-border text-foreground'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface-2 border border-border rounded-2xl px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-surface-2 shrink-0">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-muted transition-colors font-mono disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center disabled:opacity-50 shrink-0"
                >
                  <ArrowUp className="w-4 h-4 text-background" />
                </button>
              </div>

              {/* Contact human */}
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted hover:text-foreground transition-colors font-mono"
              >
                <Phone className="w-3 h-3" />
                Contactar a un humano
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
