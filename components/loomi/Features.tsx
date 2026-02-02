'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  Brain,
  Calendar,
  RefreshCw,
  Target,
  Users,
  TrendingUp,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'reasoning()',
    subtitle: 'Piensa antes de responder',
    description:
      'Chain-of-thought reasoning analiza cada mensaje. Entiende intención, detecta objeciones y personaliza la respuesta.',
    tech: 'generateReasoning()',
  },
  {
    icon: Calendar,
    title: 'schedule()',
    subtitle: 'Agenda sin intervención',
    description:
      'Integración nativa con Cal.com. Detecta interés, ofrece horarios y agenda demos automáticamente.',
    tech: 'Cal.com API',
  },
  {
    icon: RefreshCw,
    title: 'followUp()',
    subtitle: 'Nunca pierde un lead',
    description:
      'Secuencias automatizadas: recordatorios pre-demo, seguimiento post-demo, y re-engagement de leads fríos.',
    tech: 'Vercel Cron',
  },
  {
    icon: Target,
    title: 'sentiment()',
    subtitle: 'Lee emociones',
    description:
      'Analiza el tono emocional en tiempo real. Adapta respuestas para frustrados, escépticos o entusiasmados.',
    tech: 'detectSentiment()',
  },
  {
    icon: Users,
    title: 'pipeline()',
    subtitle: 'CRM integrado',
    description:
      'Pipeline visual tipo Kanban. Ve cada lead, en qué etapa está, historial completo y contexto centralizado.',
    tech: 'Built-in CRM',
  },
  {
    icon: TrendingUp,
    title: 'track()',
    subtitle: 'Optimiza campañas',
    description:
      'Tracking server-side que evita bloqueadores. Reporta conversiones reales a Meta para optimizar.',
    tech: 'Meta CAPI',
  },
];

function FeatureRow({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const x = useTransform(
    scrollYProgress,
    [0, 0.5],
    [index % 2 === 0 ? -100 : 100, 0]
  );

  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="min-h-[50vh] flex items-center py-20 border-b border-border/30 last:border-0"
    >
      <div className={`w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${!isEven ? 'lg:direction-rtl' : ''}`}>
        {/* Icon & Number */}
        <motion.div
          style={{ x: isEven ? x : undefined }}
          className={`flex items-center gap-8 ${!isEven ? 'lg:order-2 lg:justify-end' : ''}`}
        >
          <span className="text-[120px] lg:text-[180px] font-black text-surface-2 leading-none font-mono select-none">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-surface border border-border flex items-center justify-center">
            <feature.icon className="w-10 h-10 lg:w-12 lg:h-12 text-foreground" />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          style={{ x: !isEven ? x : undefined }}
          className={!isEven ? 'lg:order-1 lg:text-right' : ''}
        >
          <p className="text-muted font-mono text-sm mb-2">{feature.tech}</p>
          <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-3 font-mono">
            .{feature.title}
          </h3>
          <p className="text-xl lg:text-2xl text-muted mb-4">
            {feature.subtitle}
          </p>
          <p className="text-muted leading-relaxed max-w-lg text-lg">
            {feature.description}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-background relative">
      <div className="relative max-w-7xl mx-auto">
        {/* Cinematic header */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-32"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-muted font-mono text-sm mb-6"
          >
            // ./features
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 font-mono"
          >
            No es un chatbot básico
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl lg:text-2xl text-muted max-w-2xl mx-auto"
          >
            Cada feature maximiza conversiones, no solo responde preguntas.
          </motion.p>
        </motion.div>

        {/* Cinematic feature rows */}
        {FEATURES.map((feature, index) => (
          <FeatureRow key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}
