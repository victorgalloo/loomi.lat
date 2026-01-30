'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { HeroDemo } from './Hero';

const FEATURES = [
  {
    title: 'Entiende',
    highlight: 'lo que quieren',
    description: 'No es un bot con respuestas predefinidas. Lee el mensaje, entiende qué necesita el lead, y responde como lo harías tú.',
    visual: 'reasoning',
    color: 'neon-purple',
  },
  {
    title: 'Responde en',
    highlight: '0.8 segundos',
    description: 'El 78% de los leads compran al primero que responde. Con Loomi, siempre eres tú.',
    visual: 'speed',
    color: 'neon-yellow',
  },
  {
    title: 'Agenda',
    highlight: 'sin que hagas nada',
    description: 'Detecta cuándo el lead está listo, propone horarios de tu calendario, y confirma la cita. Solo te llega la notificación.',
    visual: 'calendar',
    color: 'neon-cyan',
  },
];


function ReasoningVisual() {
  return (
    <div className="relative">
      {/* Terminal style analysis */}
      <div className="font-mono text-sm space-y-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3"
        >
          <span className="text-neon-green">→</span>
          <span className="text-muted">input:</span>
          <span className="text-foreground">"¿Cuánto cuesta el plan pro?"</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="pl-6 space-y-2"
        >
          <div className="flex items-center gap-2">
            <motion.span
              className="px-2 py-0.5 bg-neon-purple/20 text-neon-purple text-xs rounded"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              intent: PRICING_INQUIRY
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              className="px-2 py-0.5 bg-neon-yellow/20 text-neon-yellow text-xs rounded"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            >
              sentiment: interested
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              className="px-2 py-0.5 bg-neon-cyan/20 text-neon-cyan text-xs rounded"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            >
              action: QUALIFY_LEAD
            </motion.span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3"
        >
          <span className="text-neon-green">←</span>
          <span className="text-muted">output:</span>
          <span className="text-neon-green">"¡Excelente pregunta! El plan Pro..."</span>
        </motion.div>
      </div>
    </div>
  );
}

function SpeedVisual() {
  return (
    <div className="relative">
      {/* Speed meter */}
      <div className="flex items-center gap-8">
        <motion.div
          className="text-7xl sm:text-8xl font-bold text-neon-yellow"
          style={{ textShadow: '0 0 40px rgba(255,217,61,0.3)' }}
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          0.8
        </motion.div>
        <div className="text-left">
          <div className="text-2xl text-foreground font-medium">segundos</div>
          <div className="text-muted">tiempo de respuesta</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-8 h-1 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-neon-yellow to-neon-green rounded-full"
          initial={{ width: '0%' }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted">
        <span>0s</span>
        <span className="text-neon-yellow">●</span>
        <span>2s</span>
      </div>
    </div>
  );
}

function CalendarVisual() {
  return (
    <div className="relative">
      {/* Calendar slots */}
      <div className="space-y-3">
        {['Mañana 10:00', 'Mañana 14:00', 'Mañana 16:00'].map((time, i) => (
          <motion.div
            key={time}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              i === 1
                ? 'border-neon-cyan bg-neon-cyan/5'
                : 'border-border bg-surface/30'
            }`}
          >
            <span className={i === 1 ? 'text-neon-cyan' : 'text-muted'}>{time}</span>
            {i === 1 && (
              <motion.span
                className="text-xs text-neon-cyan"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Seleccionado automáticamente
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FeatureSection({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [100, 0, 0, -100]);

  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="min-h-[70vh] flex items-center py-20"
    >
      <div className={`w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${isEven ? '' : 'lg:direction-rtl'}`}>
        {/* Text */}
        <motion.div style={{ y }} className={isEven ? '' : 'lg:order-2 lg:text-right'}>
          <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            {feature.title}{' '}
            <span className={`text-${feature.color} glow-${feature.color.replace('neon-', '')}-text`}>
              {feature.highlight}
            </span>
          </h3>
          <p className="text-xl text-muted leading-relaxed max-w-lg">
            {feature.description}
          </p>
        </motion.div>

        {/* Visual */}
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [50, 0, 0, -50]) }}
          className={isEven ? '' : 'lg:order-1'}
        >
          {feature.visual === 'reasoning' && <ReasoningVisual />}
          {feature.visual === 'speed' && <SpeedVisual />}
          {feature.visual === 'calendar' && <CalendarVisual />}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function BentoFeatures() {
  return (
    <section id="features" className="relative overflow-hidden bg-background transition-colors duration-300">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-neon-purple/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-neon-cyan/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="pt-20 pb-10 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            Así piensa Loomi.
            <br />
            <span className="text-muted">No scripts. Inteligencia real.</span>
          </motion.h2>
        </div>

        {/* WhatsApp Demo - full width showcase */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <p className="text-center text-muted text-sm font-mono mb-6">
            // Conversación en tiempo real
          </p>
          <HeroDemo />
        </motion.div>

        {/* Scrolling features */}
        {FEATURES.map((feature, index) => (
          <FeatureSection key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}
