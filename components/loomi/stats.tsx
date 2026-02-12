'use client';

import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/animated-counter';

const STATS = [
  { value: 0.8, suffix: 's', decimals: 1, label: 'respuesta' },
  { value: 100, suffix: '%', label: 'leads atendidos' },
  { value: 3, suffix: 'x', label: 'más demos' },
  { value: 78, suffix: '%', prefix: '-', label: 'no-shows' },
];

export function Stats() {
  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 relative bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-background p-8 lg:p-12 text-center"
            >
              <motion.div className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground mb-4">
                <AnimatedCounter
                  end={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  decimals={stat.decimals}
                  duration={2000}
                />
              </motion.div>
              <div className="text-muted text-sm sm:text-base">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
