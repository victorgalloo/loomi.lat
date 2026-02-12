'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'El problema',
    highlight: 'Meta no sabe qué pasó',
    isNegative: true,
  },
  {
    number: '02',
    title: 'Loomi reporta',
    highlight: 'cada conversión',
  },
  {
    number: '03',
    title: 'Meta aprende',
    highlight: 'quién compra',
  },
  {
    number: '04',
    title: 'CPL baja',
    highlight: '-32% promedio',
  },
];

function Step({ step, index, isLast }: { step: typeof STEPS[0]; index: number; isLast: boolean }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center']
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 1]);
  const isNegative = 'isNegative' in step && step.isNegative;

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="relative pb-16 last:pb-0"
    >
      {!isLast && (
        <div className="absolute left-[60px] lg:left-[80px] top-24 bottom-0 w-px bg-border" />
      )}

      <div className="flex gap-8 lg:gap-16 items-start">
        <span className="text-[80px] lg:text-[120px] font-black text-surface-2 leading-none font-mono flex-shrink-0">
          {step.number}
        </span>

        <div className="pt-4 lg:pt-8">
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2">
            {step.title}
          </h3>
          <p className={`text-2xl lg:text-3xl ${isNegative ? 'text-terminal-red' : 'text-muted'}`}>
            {step.highlight}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function MetaLoop() {
  return (
    <section className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background">
      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-3 text-muted font-mono text-sm mb-8">
            <span className="w-3 h-3 rounded-full bg-terminal-green" />
            Meta Conversions API
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-tight">
            Cierra el loop
            <br />
            <span className="text-muted">con Meta Ads</span>
          </h2>
        </motion.div>

        <div className="relative mb-16">
          {STEPS.map((step, index) => (
            <Step
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
