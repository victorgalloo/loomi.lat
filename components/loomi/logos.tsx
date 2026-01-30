'use client';

import { FadeIn } from '@/components/ui/fade-in';
import { motion } from 'framer-motion';

const TECH_LOGOS = [
  { name: 'Next.js', icon: '▲' },
  { name: 'TypeScript', icon: 'TS' },
  { name: 'Tailwind', icon: '🌊' },
  { name: 'Supabase', icon: '⚡' },
  { name: 'Vercel', icon: '▲' },
  { name: 'Claude', icon: '🤖' },
  { name: 'WhatsApp', icon: '💬' },
  { name: 'Cal.com', icon: '📅' },
];

export function Logos() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <p className="text-center text-sm font-medium text-gray-500 mb-8 uppercase tracking-wider">
            Construido con tecnología de primer nivel
          </p>
        </FadeIn>

        <div className="relative overflow-hidden">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

          {/* Scrolling logos */}
          <motion.div
            className="flex gap-12 items-center"
            animate={{ x: [0, -50 * TECH_LOGOS.length] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 20,
                ease: 'linear',
              },
            }}
          >
            {/* Duplicate for seamless loop */}
            {[...TECH_LOGOS, ...TECH_LOGOS, ...TECH_LOGOS].map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className="flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-neon-green/30 hover:bg-neon-subtle/30 transition-all flex-shrink-0"
              >
                <span className="text-2xl">{logo.icon}</span>
                <span className="font-medium text-gray-700 whitespace-nowrap">
                  {logo.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
