'use client';

import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    quote: 'Ahora agendamos 3x más demos sin contratar a nadie.',
    name: 'María González',
    role: 'CEO, ModaLab MX',
    metric: '+340%',
    metricLabel: 'demos',
    color: 'bg-emerald-100 [html[data-theme=dark]_&]:bg-emerald-900/30',
    border: 'border-emerald-200 [html[data-theme=dark]_&]:border-emerald-800/40',
  },
  {
    quote: 'Loomi les pasa solo leads listos para comprar.',
    name: 'Carlos Ruiz',
    role: 'Director Comercial, TechConsulting',
    metric: '85%',
    metricLabel: 'calificados',
    color: 'bg-violet-100 [html[data-theme=dark]_&]:bg-violet-900/30',
    border: 'border-violet-200 [html[data-theme=dark]_&]:border-violet-800/40',
  },
  {
    quote: 'Pasamos del 35% de no-shows al 8%.',
    name: 'Ana Martínez',
    role: 'Head of Growth, ClinicaDent',
    metric: '-78%',
    metricLabel: 'no-shows',
    color: 'bg-amber-100 [html[data-theme=dark]_&]:bg-amber-900/30',
    border: 'border-amber-200 [html[data-theme=dark]_&]:border-amber-800/40',
  },
];

export function Testimonials() {
  return (
    <section className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background">
      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground">
            Resultados
          </h2>
        </motion.div>

        {/* Speech bubble grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              {/* Bubble */}
              <div className={`relative rounded-2xl p-6 border ${testimonial.color} ${testimonial.border}`}>
                {/* Metric badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground text-background text-sm font-semibold font-mono mb-4">
                  {testimonial.metric}
                  <span className="text-xs font-normal opacity-70">{testimonial.metricLabel}</span>
                </div>

                <blockquote className="text-lg font-medium text-foreground leading-relaxed mb-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Tail */}
                <div
                  className={`absolute -bottom-2 left-8 w-4 h-4 rotate-45 border-b border-r ${testimonial.color} ${testimonial.border}`}
                />
              </div>

              {/* Author */}
              <div className="mt-4 ml-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center text-sm font-medium text-foreground">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
