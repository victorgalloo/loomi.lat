'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Lead escribe',
    detail: '"Vi su anuncio, ¿cuánto cuesta?"',
  },
  {
    number: '02',
    title: 'Loomi responde',
    detail: '0.8s · califica · personaliza',
  },
  {
    number: '03',
    title: 'Agenda demo',
    detail: 'Cal.com · confirmación automática',
  },
  {
    number: '04',
    title: 'Tú cierras',
    detail: 'Lead preparado · contexto completo',
  },
];

function StepItem({ step, index, isLast }: { step: typeof STEPS[0]; index: number; isLast: boolean }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center']
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 1]);
  const x = useTransform(scrollYProgress, [0, 0.5], [-50, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="relative pb-20 last:pb-0"
    >
      {!isLast && (
        <div className="absolute left-[60px] lg:left-[80px] top-28 bottom-0 w-px bg-border" />
      )}

      <div className="flex gap-8 lg:gap-16 items-start">
        <motion.div style={{ x }} className="flex-shrink-0">
          <span className="text-[80px] lg:text-[120px] font-black text-surface-2 leading-none font-mono block">
            {step.number}
          </span>
        </motion.div>

        <motion.div
          style={{ x: useTransform(scrollYProgress, [0, 0.5], [30, 0]) }}
          className="pt-4 lg:pt-8"
        >
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-mono">
            {step.title}
          </h3>
          <span className="inline-block text-lg font-mono text-muted px-4 py-2 bg-surface rounded-lg border border-border">
            {step.detail}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background">
      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground mb-6 font-mono">
            De "hola" a demo
          </h2>
          <p className="text-xl lg:text-2xl text-muted">
            Sin que toques el teléfono
          </p>
        </motion.div>

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
