'use client';

import { Button } from '@/components/ui/button-loomi';
import { ArrowRight, MessageCircle, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

// WhatsApp chat demo component
export function HeroDemo() {
  const messages = [
    { role: 'user', text: 'Hola, vi su anuncio. ¿Cuánto cuesta el seguro de vida?' },
    { role: 'agent', text: '¡Hola! 👋 Me da gusto que escribas. Para cotizarte, ¿me podrías decir tu edad?' },
    { role: 'user', text: '34 años' },
    { role: 'agent', text: 'Perfecto. Un plan básico desde $199/mes. ¿Te gustaría agendar una llamada de 15 min para ver opciones?' },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        {/* Terminal header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-terminal-red" />
            <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
            <div className="w-3 h-3 rounded-full bg-terminal-green" />
          </div>
          <span className="text-xs text-muted font-mono ml-2">whatsapp_demo</span>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-foreground text-background'
                    : 'bg-surface-2 text-foreground border border-border'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.2 }}
            className="flex justify-start"
          >
            <div className="bg-surface-2 border border-border px-4 py-2 rounded-xl flex items-center gap-1">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-terminal-green"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 rounded-full bg-terminal-green"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 rounded-full bg-terminal-green"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-background">
      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-20">
        {/* Meta Tech Provider Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-border bg-surface">
            <Image
              src="/logos/meta-logo.png"
              alt="Meta"
              width={80}
              height={26}
              className="object-contain opacity-60"
            />
            <span className="text-muted text-xs font-mono">Tech Provider</span>
          </div>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          className="text-7xl sm:text-8xl md:text-9xl lg:text-[11rem] font-black tracking-tighter mb-6 font-mono"
        >
          <span className="text-foreground">LOOMI</span>
          <span className="animate-blink text-foreground">_</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-xl sm:text-2xl md:text-3xl text-muted font-mono tracking-wide max-w-2xl mb-12"
        >
          Agente AI para WhatsApp que vende 24/7
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            <Button
              variant="primary"
              size="lg"
              className="group text-lg px-8 py-6 rounded-lg font-mono"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              ./agendar-demo
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-sm text-muted/60 font-mono"
        >
          setup en 5 minutos · sin tarjeta
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 text-muted/50"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
