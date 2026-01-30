'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot } from 'lucide-react';

interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
}

const BOT_RESPONSES: { [key: string]: string } = {
  default: 'Hola, gracias por escribir. ¿Buscas automatizar tus ventas por WhatsApp o tienes alguna pregunta específica?',
  precio: 'Claro. El plan Starter es $49/mes para hasta 500 conversaciones. El Pro ($149/mes) incluye 5,000 conversaciones y conexión con HubSpot. ¿Cuántas conversaciones manejas al mes aproximadamente?',
  demo: 'Perfecto. Tengo disponible mañana a las 10am, 2pm o 4pm. La demo dura 15 minutos. ¿Cuál te funciona mejor?',
  funciona: 'Conecto con tu WhatsApp Business y respondo en menos de 1 segundo. Entiendo lo que pregunta cada lead, lo califico, y si está listo para comprar, le agendo una demo automáticamente.',
  whatsapp: 'Uso la API oficial de WhatsApp Business. Conectas tu número en 5 minutos y empiezas a responder automáticamente. No necesitas cambiar de número.',
  hola: 'Hola. ¿Estás buscando automatizar la atención de leads por WhatsApp?',
  gracias: 'De nada. Si quieres ver cómo funcionaría con tu negocio, puedo mostrarte en una demo de 15 minutos. ¿Te interesa?',
};

function getBotResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('precio') || lower.includes('costo') || lower.includes('plan')) return BOT_RESPONSES.precio;
  if (lower.includes('demo') || lower.includes('agenda') || lower.includes('cita')) return BOT_RESPONSES.demo;
  if (lower.includes('funciona') || lower.includes('cómo') || lower.includes('como')) return BOT_RESPONSES.funciona;
  if (lower.includes('whatsapp') || lower.includes('integra')) return BOT_RESPONSES.whatsapp;
  if (lower.includes('hola') || lower.includes('hey') || lower.includes('hi')) return BOT_RESPONSES.hola;
  if (lower.includes('gracias') || lower.includes('thanks')) return BOT_RESPONSES.gracias;
  return BOT_RESPONSES.default;
}

export function InteractiveDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, type: 'bot', text: 'Hola, gracias por escribir. ¿Buscas automatizar tus ventas por WhatsApp?' }
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
    }, 1000 + Math.random() * 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSend();
    }
  };

  return (
    <section className="py-28 sm:py-40 px-4 sm:px-6 relative overflow-hidden bg-background transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-cyan/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Habla con Loomi.
          </h2>
          <p className="text-xl text-muted">
            Pregúntale lo que quieras. Así responde a tus leads.
          </p>
        </motion.div>

        {/* Chat interface */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface/30 rounded-2xl overflow-hidden border border-border"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <motion.div
              className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bot className="w-5 h-5 text-neon-green" />
            </motion.div>
            <div>
              <p className="text-foreground font-medium">Loomi</p>
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-neon-green"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <p className="text-muted text-xs">Online</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="h-[350px] p-4 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex mb-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-neon-green text-gray-900'
                        : 'bg-surface-2 text-foreground'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-surface-2 rounded-2xl px-4 py-3">
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
          <div className="p-4 border-t border-border">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder-muted focus:outline-none focus:border-neon-green/50 transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-12 h-12 rounded-xl bg-neon-green flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 text-gray-900" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mt-6"
        >
          {['¿Cuánto cuesta?', '¿Cómo funciona?', 'Quiero una demo'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="px-4 py-2 text-sm text-muted border border-border rounded-full hover:border-muted hover:text-foreground transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
