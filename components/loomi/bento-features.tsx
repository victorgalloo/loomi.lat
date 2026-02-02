'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { HeroDemo } from './Hero';

const FEATURES = [
  {
    title: 'entiende()',
    highlight: 'lo que quieren',
    description: 'No es un bot con respuestas predefinidas. Lee el mensaje, entiende qué necesita el lead, y responde como lo harías tú.',
    visual: 'reasoning',
  },
  {
    title: 'respond()',
    highlight: '0.8 segundos',
    description: 'El 78% de los leads compran al primero que responde. Con Loomi, siempre eres tú.',
    visual: 'speed',
  },
  {
    title: 'schedule()',
    highlight: 'sin que hagas nada',
    description: 'Detecta cuándo el lead está listo, propone horarios de tu calendario, y confirma la cita. Solo te llega la notificación.',
    visual: 'calendar',
  },
  {
    title: 'pipeline()',
    highlight: 'sin salir de Loomi',
    description: 'Pipeline visual tipo Kanban. Ve cada lead, en qué etapa está, y todo el historial de conversaciones en un solo lugar.',
    visual: 'crm',
  },
  {
    title: 'track()',
    highlight: 'campañas de Meta',
    description: 'Conversions API server-side. Reporta cada conversión real a Meta para optimizar campañas y bajar tu costo por lead.',
    visual: 'meta',
  },
];

// Cinematic visual components
function ReasoningVisual() {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="space-y-4 font-mono"
      >
        <div className="flex items-center gap-4">
          <span className="text-6xl font-bold text-foreground">→</span>
          <div>
            <p className="text-muted text-sm">input:</p>
            <p className="text-2xl text-foreground">"¿Cuánto cuesta el plan pro?"</p>
          </div>
        </div>

        <div className="pl-20 space-y-2">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-2 bg-surface text-foreground text-lg rounded-lg border border-border"
          >
            intent: PRICING_INQUIRY
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="inline-block px-4 py-2 bg-terminal-green/10 text-terminal-green text-lg rounded-lg ml-4"
          >
            confidence: 94%
          </motion.span>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <span className="text-6xl font-bold text-terminal-green">←</span>
          <div>
            <p className="text-muted text-sm">output:</p>
            <p className="text-2xl text-foreground">"¡Excelente pregunta! El plan Pro..."</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SpeedVisual() {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-[140px] lg:text-[200px] font-black text-foreground font-mono leading-none"
        >
          0.8
        </motion.span>
        <p className="text-3xl text-muted font-mono mt-4">segundos</p>

        <div className="mt-8 h-2 bg-border rounded-full overflow-hidden max-w-md mx-auto">
          <motion.div
            className="h-full bg-foreground rounded-full"
            initial={{ width: '0%' }}
            whileInView={{ width: '100%' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function CalendarVisual() {
  const slots = ['Mañana 10:00', 'Mañana 14:00', 'Mañana 16:00'];

  return (
    <div className="space-y-4 font-mono max-w-sm mx-auto lg:mx-0">
      {slots.map((time, i) => (
        <motion.div
          key={time}
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
          className={`p-6 rounded-xl border-2 transition-all ${
            i === 1
              ? 'border-foreground bg-foreground/5 scale-105'
              : 'border-border bg-surface/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xl ${i === 1 ? 'text-foreground font-bold' : 'text-muted'}`}>
              {time}
            </span>
            {i === 1 && (
              <span className="text-terminal-green text-lg font-bold">
                ✓ selected
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CRMVisual() {
  const stages = [
    { name: 'nuevo', count: 12, width: '100%' },
    { name: 'contacto', count: 8, width: '66%' },
    { name: 'demo', count: 5, width: '42%' },
    { name: 'cerrado', count: 3, width: '25%' },
  ];

  return (
    <div className="space-y-6 font-mono">
      {stages.map((stage, i) => (
        <motion.div
          key={stage.name}
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg text-muted">.{stage.name}</span>
            <span className="text-2xl font-bold text-foreground">{stage.count}</span>
          </div>
          <div className="h-3 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground rounded-full"
              initial={{ width: '0%' }}
              whileInView={{ width: stage.width }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MetaVisual() {
  return (
    <div className="font-mono">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-6 mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
          <span className="text-foreground text-3xl font-black">M</span>
        </div>
        <div>
          <p className="text-muted">Meta Conversions API</p>
          <p className="text-xl text-foreground font-medium">server_side_tracking</p>
        </div>
        <span className="px-4 py-2 bg-terminal-green/10 text-terminal-green rounded-lg ml-auto">
          active
        </span>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        {[
          { label: 'cpl', value: '-32%' },
          { label: 'roas', value: '+48%' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="text-center p-6 rounded-xl border border-border bg-surface"
          >
            <p className="text-muted mb-2">.{stat.label}</p>
            <p className="text-4xl font-black text-foreground">{stat.value}</p>
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

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -100]);

  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="min-h-screen flex items-center py-20"
    >
      <div className={`w-full grid lg:grid-cols-2 gap-16 lg:gap-24 items-center`}>
        {/* Text */}
        <motion.div
          style={{ y }}
          className={!isEven ? 'lg:order-2' : ''}
        >
          <p className="text-muted font-mono text-sm mb-4">
            // feature_{String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground leading-none mb-4 font-mono">
            .{feature.title}
          </h3>
          <p className="text-3xl lg:text-4xl text-muted mb-6">
            {feature.highlight}
          </p>
          <p className="text-xl text-muted/80 leading-relaxed max-w-xl">
            {feature.description}
          </p>
        </motion.div>

        {/* Visual */}
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [50, 0, 0, -50]) }}
          className={!isEven ? 'lg:order-1' : ''}
        >
          {feature.visual === 'reasoning' && <ReasoningVisual />}
          {feature.visual === 'speed' && <SpeedVisual />}
          {feature.visual === 'calendar' && <CalendarVisual />}
          {feature.visual === 'crm' && <CRMVisual />}
          {feature.visual === 'meta' && <MetaVisual />}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function BentoFeatures() {
  return (
    <section id="features" className="relative overflow-hidden bg-background">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Cinematic section header */}
        <div className="min-h-[60vh] flex flex-col justify-center items-center text-center py-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-muted font-mono text-sm mb-8"
          >
            // así piensa loomi
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-foreground mb-6 font-mono leading-none"
          >
            No scripts.
            <br />
            <span className="text-muted">Inteligencia real.</span>
          </motion.h2>
        </div>

        {/* WhatsApp Demo - full width cinematic showcase */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <p className="text-center text-muted text-sm font-mono mb-8">
            $ conversación en tiempo real
          </p>
          <HeroDemo />
        </motion.div>

        {/* Cinematic scrolling features */}
        {FEATURES.map((feature, index) => (
          <FeatureSection key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}
