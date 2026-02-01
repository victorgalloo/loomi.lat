'use client';

import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/animated-counter';

const STATS = [
  { value: 0.8, suffix: 's', decimals: 1, label: 'Tiempo de respuesta', color: 'neon-green', glow: 'rgba(0,255,102,0.3)' },
  { value: 32, suffix: '%', prefix: '-', label: 'Costo por lead', color: 'neon-cyan', glow: 'rgba(78,205,196,0.3)' },
  { value: 100, suffix: '%', label: 'Leads respondidos', color: 'neon-yellow', glow: 'rgba(255,217,61,0.3)' },
  { value: 3, suffix: 'x', label: 'ROI en campañas', color: 'neon-purple', glow: 'rgba(168,85,247,0.3)' },
];

export function Stats() {
  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 relative bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Stats - horizontal scroll on mobile, grid on desktop */}
        <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-12 lg:gap-8 pb-4 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex-shrink-0 min-w-[200px] lg:min-w-0 text-center"
            >
              {/* Number */}
              <motion.div
                className={`text-5xl sm:text-6xl lg:text-7xl font-bold text-${stat.color} mb-3`}
                style={{ textShadow: `0 0 40px ${stat.glow}` }}
              >
                <AnimatedCounter
                  end={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  decimals={stat.decimals}
                  duration={2000}
                />
              </motion.div>

              {/* Label */}
              <div className="text-muted text-sm sm:text-base font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
