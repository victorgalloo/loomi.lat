'use client';

import { Button } from '@/components/ui/button-loomi';
import { ArrowRight, MessageCircle, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

// WhatsApp chat demo component
export function HeroDemo() {
  const messages = [
    { role: 'user', text: 'Hola, vi su anuncio. ¿Qué hace su plataforma?' },
    { role: 'agent', text: '¡Hola! 👋 Automatizamos ventas por WhatsApp con IA. ¿Cuántos leads recibes al mes?' },
    { role: 'user', text: 'Unos 200, pero solo atendemos la mitad' },
    { role: 'agent', text: 'Con Loomi puedes atender el 100% en <1s. ¿Te agendo una demo de 15 min?' },
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
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
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
            <div className="bg-surface-2 border border-border px-4 py-2 rounded-2xl flex items-center gap-1">
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

// Floating decorative shapes
const FLOATING_SHAPES = [
  { size: 6, x: '15%', y: '20%', delay: 0, duration: 7 },
  { size: 4, x: '80%', y: '15%', delay: 1, duration: 9 },
  { size: 8, x: '10%', y: '70%', delay: 2, duration: 8 },
  { size: 5, x: '85%', y: '65%', delay: 0.5, duration: 10 },
  { size: 3, x: '50%', y: '85%', delay: 1.5, duration: 6 },
  { size: 7, x: '70%', y: '40%', delay: 3, duration: 11 },
];

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

      {/* Floating dots/shapes */}
      {FLOATING_SHAPES.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-foreground/5 pointer-events-none"
          style={{ width: shape.size, height: shape.size, left: shape.x, top: shape.y }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            delay: shape.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

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
            <span className="text-muted text-xs">Tech Provider</span>
          </div>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          className="text-7xl sm:text-8xl md:text-9xl lg:text-[11rem] font-black tracking-tighter mb-6"
        >
          <span className="text-foreground">LOOMI</span>
          <span className="animate-blink text-foreground">_</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-xl sm:text-2xl md:text-3xl text-muted tracking-wide max-w-2xl mb-12"
        >
          Agente AI para WhatsApp que vende 24/7
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/login">
            <Button
              variant="primary"
              size="lg"
              className="group text-lg px-8 py-6 rounded-xl w-full sm:w-auto relative overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              Empezar gratis
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            <Button
              variant="secondary"
              size="lg"
              className="group text-lg px-8 py-6 rounded-xl w-full sm:w-auto"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              WhatsApp
            </Button>
          </a>
        </motion.div>

        {/* Trust line with animated counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <p className="text-sm text-muted/60">
            Setup en 5 minutos · Sin tarjeta
          </p>
          <div className="flex items-center gap-2 text-xs text-muted/40">
            <span className="tabular-nums font-medium text-muted/60">200+ empresas</span>
            <span>confían en Loomi</span>
          </div>
        </motion.div>
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
