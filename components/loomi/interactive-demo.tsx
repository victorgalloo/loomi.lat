'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
}

// Scripted responses for quick buttons (instant)
const SCRIPTED_RESPONSES: { [key: string]: string } = {
  '¿Precio?': 'Starter $199/mes, Growth $349/mes, Business $599/mes. ¿Cuántos mensajes recibes al día?',
  '¿Cómo funciona?': 'Conectas tu WhatsApp, configuras tu agente, y respondo 24/7 calificando leads y agendando demos.',
  'Quiero demo': 'Tengo disponible mañana 10am, 2pm o 4pm. ¿Cuál te funciona?',
};

export function InteractiveDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, type: 'bot', text: '¿Buscas automatizar ventas por WhatsApp?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Scripted response (instant)
  const handleScriptedResponse = useCallback((userText: string, botResponse: string) => {
    const userMessage: Message = { id: Date.now(), type: 'user', text: userText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: Date.now() + 1, type: 'bot', text: botResponse }]);
    }, 400 + Math.random() * 200);
  }, []);

  // Real API call (lite agent)
  const handleRealMessage = useCallback(async (text: string) => {
    const userMessage: Message = { id: Date.now(), type: 'user', text };

    const history = messages.map(m => ({
      role: m.type === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      const data = await res.json();

      setIsTyping(false);
      if (res.ok && data.response) {
        setMessages((prev) => [...prev, { id: Date.now() + 1, type: 'bot', text: data.response }]);
      } else {
        setMessages((prev) => [...prev, { id: Date.now() + 1, type: 'bot', text: '¿Te gustaría agendar una demo para ver más?' }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: Date.now() + 1, type: 'bot', text: '¿Te gustaría agendar una demo para ver más?' }]);
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isTyping) return;

    if (SCRIPTED_RESPONSES[text]) {
      handleScriptedResponse(text, SCRIPTED_RESPONSES[text]);
    } else {
      handleRealMessage(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickButton = (text: string) => {
    if (isTyping) return;
    if (SCRIPTED_RESPONSES[text]) {
      handleScriptedResponse(text, SCRIPTED_RESPONSES[text]);
    } else {
      setInput(text);
    }
  };

  return (
    <section className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background">
      <div className="relative max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground mb-6 font-mono">
            Pruébalo
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface rounded-xl overflow-hidden border border-border"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-terminal-red" />
              <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
              <div className="w-3 h-3 rounded-full bg-terminal-green" />
            </div>
            <span className="text-xs text-muted font-mono ml-2">loomi — demo</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
              <span className="text-xs text-muted font-mono">live</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="h-[300px] p-4 overflow-y-auto bg-background">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex mb-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 font-mono text-sm ${
                      message.type === 'user'
                        ? 'bg-foreground text-background'
                        : 'bg-surface-2 border border-border text-foreground'
                    }`}
                  >
                    {message.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-surface-2 border border-border rounded-lg px-4 py-3">
                  <div className="flex gap-2 items-center">
                    <Loader2 className="w-4 h-4 text-terminal-green animate-spin" />
                    <span className="text-xs text-muted font-mono">thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-surface-2">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe algo..."
                disabled={isTyping}
                className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm placeholder-muted focus:outline-none focus:border-muted transition-colors font-mono disabled:opacity-50"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 rounded-lg bg-foreground flex items-center justify-center disabled:opacity-50"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 text-background animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-background" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Quick suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {Object.keys(SCRIPTED_RESPONSES).map((s) => (
            <button
              key={s}
              onClick={() => handleQuickButton(s)}
              disabled={isTyping}
              className="px-4 py-2 text-sm text-muted border border-border rounded-lg hover:text-foreground transition-colors font-mono disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Demo notice */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-lg border border-border bg-surface"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-terminal-yellow/10 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-terminal-yellow" />
            </div>
            <div>
              <p className="text-sm text-foreground font-medium font-mono mb-1">
                Demo simplificada
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Esta es una versión ligera. El agente real incluye análisis de sentimiento,
                memoria contextual, calificación de leads y más.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-foreground hover:text-terminal-green transition-colors font-mono"
              >
                Solicitar acceso completo
                <span className="text-terminal-green">→</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
