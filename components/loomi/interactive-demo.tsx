'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';

interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
}

const BOT_RESPONSES: { [key: string]: string } = {
  default: '¿Buscas automatizar ventas por WhatsApp?',
  precio: 'Starter $199/mes, Growth $349/mes, Business $599/mes. ¿Cuántos mensajes recibes al día?',
  demo: 'Tengo disponible mañana 10am, 2pm o 4pm. ¿Cuál te funciona?',
  funciona: 'Respondo en <1s, califico leads y agendo demos automáticamente.',
  hola: '¿Buscas automatizar ventas por WhatsApp?',
};

function getBotResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('precio') || lower.includes('costo') || lower.includes('plan')) return BOT_RESPONSES.precio;
  if (lower.includes('demo') || lower.includes('agenda')) return BOT_RESPONSES.demo;
  if (lower.includes('funciona') || lower.includes('cómo')) return BOT_RESPONSES.funciona;
  if (lower.includes('hola') || lower.includes('hey')) return BOT_RESPONSES.hola;
  return BOT_RESPONSES.default;
}

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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: getBotResponse(userMessage.text),
      }]);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
            <span className="text-xs text-muted font-mono ml-2">loomi</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-terminal-green" />
              <span className="text-xs text-muted font-mono">online</span>
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
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 bg-muted rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
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
                className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm placeholder-muted focus:outline-none focus:border-border-hover transition-colors font-mono"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-12 h-12 rounded-lg bg-foreground flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-background" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Quick suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {['¿Precio?', '¿Cómo funciona?', 'Quiero demo'].map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="px-4 py-2 text-sm text-muted border border-border rounded-lg hover:text-foreground transition-colors font-mono"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
