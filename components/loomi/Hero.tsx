'use client';

import { Button } from '@/components/ui/button-loomi';
import { ArrowRight, MessageCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CheckCheck, Bot, Sparkles, Calendar, Bell } from 'lucide-react';
import Image from 'next/image';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

const DEMO_SEQUENCE = [
  { type: 'user', text: 'Hola, vi su anuncio. ¿Cuánto cuesta?', time: '14:32' },
  { type: 'analysis', intent: 'PRICING', sentiment: 0.82, action: 'QUALIFY' },
  { type: 'bot', text: 'Hola. El plan Growth es $349 USD/mes con hasta 300 msgs/día. ¿Cuántos mensajes recibes?', time: '14:32' },
  { type: 'user', text: 'Como 200-300 al día, no doy abasto', time: '14:33' },
  { type: 'analysis', intent: 'PAIN_POINT', sentiment: 0.91, action: 'BOOK' },
  { type: 'bot', text: 'Con ese volumen Growth es ideal. ¿Demo de 15 min mañana a las 10am?', time: '14:33' },
  { type: 'user', text: 'Sí, mañana a las 10 va', time: '14:34' },
  { type: 'calendar', date: 'Mañana', time: '10:00 AM' },
  { type: 'bot', text: 'Listo. Te envié la invitación. Mañana 10am.', time: '14:34' },
  { type: 'notification', title: 'Demo agendada', subtitle: 'Mañana 10:00 AM' },
];

interface DemoMessage {
  id: number;
  type: 'user' | 'bot';
  text: string;
  time: string;
}

function AnalysisOverlay({ intent, sentiment, action }: { intent: string; sentiment: number; action: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl"
    >
      <div className="text-center">
        <motion.div
          className="w-10 h-10 rounded-full bg-neon-purple/10 flex items-center justify-center mx-auto mb-3"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-5 h-5 text-neon-purple" />
        </motion.div>
        <p className="text-xs text-muted mb-3">Analizando...</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-2 py-0.5 bg-neon-purple/10 text-neon-purple text-[10px] rounded-full"
          >
            {intent}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="px-2 py-0.5 bg-neon-green/10 text-neon-green text-[10px] rounded-full"
          >
            {(sentiment * 100).toFixed(0)}% positivo
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-[10px] rounded-full"
          >
            {action}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

function CalendarOverlay({ date, time }: { date: string; time: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl"
    >
      <div className="text-center">
        <motion.div
          className="w-10 h-10 rounded-full bg-neon-yellow/10 flex items-center justify-center mx-auto mb-3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Calendar className="w-5 h-5 text-neon-yellow" />
        </motion.div>
        <p className="text-xs text-muted mb-2">Agendando...</p>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface border border-border rounded-lg px-4 py-2"
        >
          <p className="text-foreground font-medium text-sm">{date} · {time}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function NotificationToast({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute top-2 left-2 right-2 z-20"
    >
      <div className="flex items-center gap-2 bg-surface border border-neon-green/30 rounded-lg px-3 py-2 shadow-lg">
        <div className="w-8 h-8 rounded-full bg-neon-green/10 flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4 text-neon-green" />
        </div>
        <div className="min-w-0">
          <p className="text-foreground font-medium text-xs truncate">{title}</p>
          <p className="text-muted text-[10px] truncate">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-surface border border-border rounded-xl rounded-bl-sm px-3 py-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 bg-muted rounded-full"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroDemo() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState<{ intent: string; sentiment: number; action: string } | null>(null);
  const [showCalendar, setShowCalendar] = useState<{ date: string; time: string } | null>(null);
  const [showNotification, setShowNotification] = useState<{ title: string; subtitle: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (currentStep >= DEMO_SEQUENCE.length) {
      const timeout = setTimeout(() => {
        setMessages([]);
        setCurrentStep(0);
        setShowAnalysis(null);
        setShowCalendar(null);
        setShowNotification(null);
      }, 4000);
      return () => clearTimeout(timeout);
    }

    const step = DEMO_SEQUENCE[currentStep];

    if (step.type === 'user') {
      const delay = currentStep === 0 ? 800 : 1800;
      const timeout = setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: Date.now(),
          type: 'user',
          text: step.text!,
          time: step.time!,
        }]);
        setCurrentStep((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }

    if (step.type === 'analysis') {
      const timeout = setTimeout(() => {
        setShowAnalysis({ intent: step.intent!, sentiment: step.sentiment!, action: step.action! });
        setTimeout(() => {
          setShowAnalysis(null);
          setCurrentStep((prev) => prev + 1);
        }, 1200);
      }, 400);
      return () => clearTimeout(timeout);
    }

    if (step.type === 'bot') {
      setIsTyping(true);
      const timeout = setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, {
          id: Date.now(),
          type: 'bot',
          text: step.text!,
          time: step.time!,
        }]);
        setCurrentStep((prev) => prev + 1);
      }, 1000);
      return () => clearTimeout(timeout);
    }

    if (step.type === 'calendar') {
      const timeout = setTimeout(() => {
        setShowCalendar({ date: step.date!, time: step.time! });
        setTimeout(() => {
          setShowCalendar(null);
          setCurrentStep((prev) => prev + 1);
        }, 1500);
      }, 400);
      return () => clearTimeout(timeout);
    }

    if (step.type === 'notification') {
      const timeout = setTimeout(() => {
        setShowNotification({ title: step.title!, subtitle: step.subtitle! });
        setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
        }, 2000);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [currentStep]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-2xl shadow-black/5">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neon-green/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-neon-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium text-sm">Loomi</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
              <p className="text-muted text-xs">Respondiendo</p>
            </div>
          </div>
          <span className="text-[10px] text-muted font-mono">WhatsApp</span>
        </div>

        {/* Messages */}
        <div className="h-[320px] p-3 overflow-hidden bg-background relative">
          <AnimatePresence>
            {showAnalysis && (
              <AnalysisOverlay
                intent={showAnalysis.intent}
                sentiment={showAnalysis.sentiment}
                action={showAnalysis.action}
              />
            )}
            {showCalendar && (
              <CalendarOverlay
                date={showCalendar.date}
                time={showCalendar.time}
              />
            )}
            {showNotification && (
              <NotificationToast
                title={showNotification.title}
                subtitle={showNotification.subtitle}
              />
            )}
          </AnimatePresence>

          <div className="space-y-2.5 h-full overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-xl px-3 py-2 max-w-[85%] ${
                      message.type === 'user'
                        ? 'bg-neon-green text-gray-900 rounded-br-sm'
                        : 'bg-surface border border-border text-foreground rounded-bl-sm'
                    }`}
                  >
                    <p className="text-[13px] leading-relaxed">{message.text}</p>
                    <div className={`flex items-center gap-1 mt-0.5 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[9px] ${message.type === 'user' ? 'text-gray-700' : 'text-muted'}`}>
                        {message.time}
                      </span>
                      {message.type === 'user' && (
                        <CheckCheck className="w-3 h-3 text-gray-700" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && <TypingIndicator />}
          </div>
        </div>

        {/* Progress */}
        <div className="px-3 py-2 border-t border-border bg-surface/50">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-neon-green rounded-full"
                animate={{ width: `${(currentStep / DEMO_SEQUENCE.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-[10px] text-muted font-mono w-8 text-right">
              {Math.min(Math.round((currentStep / DEMO_SEQUENCE.length) * 30), 30)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stack logos for marquee
const STACK_LOGOS = [
  { name: 'WhatsApp', src: '/logos/whatsapp.svg' },
  { name: 'Claude', src: '/logos/claude.svg' },
  { name: 'Supabase', src: '/logos/supabase.svg' },
  { name: 'Vercel', src: '/logos/vercel.svg' },
  { name: 'HubSpot', src: '/logos/hubspot.svg' },
  { name: 'Cal.com', src: '/logos/calcom.svg' },
  { name: 'Stripe', src: '/logos/stripe.svg' },
  { name: 'Slack', src: '/logos/slack.svg' },
  { name: 'Upstash', src: '/logos/upstash.svg' },
  { name: 'Next.js', src: '/logos/next.svg' },
  { name: 'TypeScript', src: '/logos/typescript.svg' },
  { name: 'React', src: '/logos/react.svg' },
  { name: 'PostgreSQL', src: '/logos/postgresql.svg' },
  { name: 'Tailwind', src: '/logos/tailwind.svg' },
  { name: 'Docker', src: '/logos/docker.svg' },
];

export function Hero() {
  return (
    <section className="relative h-screen flex flex-col justify-center items-center overflow-hidden bg-background transition-colors duration-300">
      {/* Cinematic background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Central glow - the main dramatic effect */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,255,102,0.15) 0%, rgba(0,255,102,0.05) 40%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Secondary purple accent glow */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }}
        />

        {/* Top vignette */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />

        {/* Bottom vignette */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Main content - centered and minimal */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6">
        {/* Meta Tech Provider Badge - subtle, no cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="inline-flex flex-col items-center gap-4">
            {/* Meta Logo inline */}
            <div className="flex items-center gap-4">
              <Image
                src="/logos/meta-logo.png"
                alt="Meta"
                width={100}
                height={32}
                className="object-contain opacity-60"
              />
              <span className="text-muted/60">|</span>
              <span className="text-sm text-muted/80 tracking-wide">Tech Provider</span>
            </div>
            <span className="inline-flex items-center gap-2 text-sm text-muted/60 tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              Powered by Claude AI
            </span>
          </div>
        </motion.div>

        {/* Main logo/title with dramatic glow */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          className="relative text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tighter mb-6"
        >
          {/* Glow layers behind text */}
          <span
            className="absolute inset-0 text-neon-green blur-3xl opacity-50 z-0"
            aria-hidden="true"
          >
            LOOMI
          </span>
          <span
            className="absolute inset-0 text-neon-green blur-xl opacity-40 z-0"
            aria-hidden="true"
          >
            LOOMI
          </span>
          {/* Main text */}
          <span
            className="relative z-10 text-foreground"
            style={{
              textShadow: '0 0 60px rgba(0,255,102,0.6), 0 0 100px rgba(0,255,102,0.4)',
            }}
          >
            LOOMI
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-xl sm:text-2xl md:text-3xl text-muted font-light tracking-wide max-w-2xl mb-12"
        >
          Tu agente de ventas AI que cierra mientras duermes
        </motion.p>

        {/* Single prominent CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            <Button
              variant="primary"
              size="lg"
              glow
              className="group text-lg px-8 py-6 rounded-full"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              Agendar Demo Gratis
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-sm text-muted/60"
        >
          Sin tarjeta de crédito · Setup en 5 minutos
        </motion.p>
      </div>

      {/* Scroll indicator at bottom */}
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
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>

      {/* Integrations Marquee - subtle at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-24 left-0 right-0 z-10 overflow-hidden"
      >
        {/* Marquee container */}
        <div className="relative">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Logos row */}
          <div className="flex animate-marquee">
            {[...STACK_LOGOS, ...STACK_LOGOS].map((logo, index) => (
              <div key={`${logo.name}-${index}`} className="flex-shrink-0 mx-8">
                <div className="relative w-8 h-8 opacity-30 hover:opacity-60 transition-opacity">
                  <Image
                    alt={logo.name}
                    src={logo.src}
                    fill
                    className="object-contain grayscale"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
