'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const FUNNEL_STEPS = [
  {
    number: '01',
    title: 'El problema',
    highlight: 'del hoyo negro',
    description: 'La mayoría de chatbots terminan aquí: Ad → Click → WhatsApp → ??? Meta no sabe qué pasó. No puede optimizar. La agencia sigue pagando por leads basura.',
    detail: 'Sin datos de conversión, el algoritmo está ciego.',
    colorClass: 'red-400',
  },
  {
    number: '02',
    title: 'Loomi reporta',
    highlight: 'cada evento',
    description: 'Cuando Loomi califica un lead, lo reporta. Cuando agenda una demo, lo reporta. Cuando se cierra la venta, lo reporta. Todo vía Conversions API server-side.',
    detail: 'Lead → CompleteRegistration → Purchase',
    colorClass: 'neon-purple',
  },
  {
    number: '03',
    title: 'Meta aprende',
    highlight: 'quién SÍ compra',
    description: 'Con datos reales de conversión, el algoritmo de Meta empieza a buscar perfiles similares a los que sí compraron. Tu CPL baja. Tu ROAS sube.',
    detail: '-32% costo por lead promedio',
    colorClass: 'neon-cyan',
  },
  {
    number: '04',
    title: 'El ciclo',
    highlight: 'se repite',
    description: 'Mejores leads llegan. Loomi los convierte. Reporta las conversiones. Meta optimiza más. Cada semana tu embudo es más eficiente.',
    detail: 'Flywheel de optimización continua',
    colorClass: 'neon-green',
  },
];

function FunnelStep({ step, index, isLast }: { step: typeof FUNNEL_STEPS[0]; index: number; isLast: boolean }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center']
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="relative pl-8 lg:pl-12 pb-16 last:pb-0"
    >
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[11px] lg:left-[15px] top-10 bottom-0 w-px bg-border" />
      )}

      {/* Dot on the line */}
      <motion.div
        className={`absolute left-0 lg:left-1 top-1 w-6 h-6 rounded-full border-2 border-${step.colorClass} bg-background flex items-center justify-center`}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, type: 'spring' }}
      >
        <motion.div
          className={`w-2 h-2 rounded-full bg-${step.colorClass}`}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
        />
      </motion.div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-12">
        {/* Number */}
        <motion.span
          className={`text-6xl lg:text-8xl font-bold text-${step.colorClass}/20 leading-none`}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
        >
          {step.number}
        </motion.span>

        {/* Text */}
        <div className="flex-1 pt-2">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
            {step.title}{' '}
            <span className={`text-${step.colorClass}`}>
              {step.highlight}
            </span>
          </h3>
          <p className="text-lg text-muted mb-4 max-w-xl">
            {step.description}
          </p>
          <p className={`text-sm font-mono text-${step.colorClass}`}>
            {step.detail}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function MetaLoop() {
  return (
    <section className="py-28 sm:py-40 px-4 sm:px-6 relative overflow-hidden bg-background transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-neon-purple/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-neon-green/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 text-sm text-muted/80 tracking-wide uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
            Meta Conversions API
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            El loop que tus competidores
            <br />
            <span className="text-neon-green">no saben implementar.</span>
          </h2>
          <p className="text-xl text-muted max-w-3xl mx-auto">
            La mayoría de chatbots solo responden mensajes. Loomi cierra el funnel completo con Meta Ads.
          </p>
        </motion.div>

        {/* Funnel Steps - Timeline style like HowItWorks */}
        <div className="relative mb-20">
          {FUNNEL_STEPS.map((step, index) => (
            <FunnelStep
              key={step.number}
              step={step}
              index={index}
              isLast={index === FUNNEL_STEPS.length - 1}
            />
          ))}
        </div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xl text-muted mb-4">
            El pitch no es "un chatbot"
          </p>
          <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground max-w-3xl mx-auto">
            Es{' '}
            <span className="text-neon-green" style={{ textShadow: '0 0 40px rgba(0,255,102,0.3)' }}>
              "te cierro el loop de conversión"
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
