'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Llega el mensaje',
    description: 'Un lead escribe a tu WhatsApp. Antes, lo perdías porque tardabas en responder. Ahora no.',
    detail: '"Vi su anuncio, ¿cuánto cuesta?"',
    colorClass: 'neon-green',
  },
  {
    number: '02',
    title: 'Loomi responde',
    description: 'En 0.8 segundos. Entiende qué quiere, responde con contexto, y hace las preguntas correctas para calificar.',
    detail: 'Sin scripts genéricos. Conversaciones reales.',
    colorClass: 'neon-purple',
  },
  {
    number: '03',
    title: 'Demo agendada',
    description: 'Detecta que está listo para comprar y agenda directo en tu calendario. Tú solo recibes la notificación.',
    detail: 'Mañana 10:00 AM confirmado ✓',
    colorClass: 'neon-cyan',
  },
  {
    number: '04',
    title: 'El lead llega',
    description: 'Recordatorios automáticos antes de la demo. El lead llega preparado y con contexto. Tú solo cierras.',
    detail: '78% menos no-shows',
    colorClass: 'neon-yellow',
  },
];

function StepItem({ step, index, isLast }: { step: typeof STEPS[0]; index: number; isLast: boolean }) {
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
            {step.title}
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

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 sm:py-40 px-4 sm:px-6 relative overflow-hidden bg-background transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-neon-green/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-neon-purple/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            De "hola" a demo agendada.
            <br />
            <span className="text-muted">Sin que toques el teléfono.</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {STEPS.map((step, index) => (
            <StepItem
              key={step.number}
              step={step}
              index={index}
              isLast={index === STEPS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
