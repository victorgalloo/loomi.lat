'use client';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CheckCheck } from 'lucide-react';

interface Message {
  id: number;
  type: 'user' | 'bot' | 'typing';
  text?: string;
  time?: string;
}

const CHAT_SEQUENCE: Omit<Message, 'id'>[] = [
  { type: 'user', text: 'Hola! Tengo una tienda de ropa online', time: '10:23' },
  { type: 'typing' },
  { type: 'bot', text: 'Hola. Detecté que tienes e-commerce de moda. ¿Cuántos mensajes recibes al día aproximadamente?', time: '10:23' },
  { type: 'user', text: 'Como 50-80, y no doy abasto', time: '10:24' },
  { type: 'typing' },
  { type: 'bot', text: 'Con ese volumen, probablemente estás perdiendo 20-30% de ventas por respuestas tardías. Es lo más común.', time: '10:24' },
  { type: 'user', text: 'Sí, eso me preocupa', time: '10:25' },
  { type: 'typing' },
  { type: 'bot', text: '¿Te gustaría ver cómo automatizar esto sin perder el toque personal? Tengo disponible mañana a las 10am.', time: '10:25' },
  { type: 'user', text: 'Perfecto, agéndame', time: '10:26' },
  { type: 'typing' },
  { type: 'bot', text: 'Listo. Te envié la invitación al correo. Mañana 10am.', time: '10:26' },
];

const MESSAGE_DELAYS = [0, 1200, 2500, 4000, 5200, 7000, 9500, 10700, 13000, 14200, 16500, 18000];
const LOOP_DELAY = 22000;

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= CHAT_SEQUENCE.length) {
      const timeout = setTimeout(() => {
        setMessages([]);
        setCurrentIndex(0);
      }, LOOP_DELAY - MESSAGE_DELAYS[MESSAGE_DELAYS.length - 1]);
      return () => clearTimeout(timeout);
    }

    const delay = currentIndex === 0 ? 600 : MESSAGE_DELAYS[currentIndex] - MESSAGE_DELAYS[currentIndex - 1];

    const timeout = setTimeout(() => {
      const newMessage = CHAT_SEQUENCE[currentIndex];

      if (newMessage.type === 'typing') {
        setMessages((prev) => [...prev, { ...newMessage, id: Date.now() }]);
        setTimeout(() => {
          setMessages((prev) => prev.filter((m) => m.type !== 'typing'));
          setCurrentIndex((i) => i + 1);
        }, 800);
      } else {
        setMessages((prev) => [
          ...prev.filter((m) => m.type !== 'typing'),
          { ...newMessage, id: Date.now() },
        ]);
        setCurrentIndex((i) => i + 1);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [currentIndex]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Simple chat container */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {/* Minimal header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neon-green/10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-neon-green" />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">Loomi</p>
            <p className="text-muted text-xs">Responde en &lt;1s</p>
          </div>
        </div>

        {/* Chat area */}
        <div className="h-[360px] p-4 overflow-hidden bg-background">
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
                  {message.type === 'typing' ? (
                    <div className="bg-surface rounded-xl px-4 py-3 border border-border">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 bg-muted rounded-full"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'rounded-xl px-4 py-2.5 max-w-[85%]',
                        message.type === 'user'
                          ? 'bg-neon-green text-gray-900'
                          : 'bg-surface border border-border text-foreground'
                      )}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.text}
                      </p>
                      <div className={cn(
                        'flex items-center gap-1 mt-1',
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      )}>
                        <span className={cn(
                          'text-[10px]',
                          message.type === 'user' ? 'text-gray-800/60' : 'text-muted'
                        )}>
                          {message.time}
                        </span>
                        {message.type === 'user' && (
                          <CheckCheck className="w-3 h-3 text-gray-800/60" />
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
