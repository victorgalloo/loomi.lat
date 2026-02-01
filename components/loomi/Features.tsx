'use client';

import { Card } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
import { motion } from 'framer-motion';
import {
  Brain,
  Calendar,
  RefreshCw,
  Target,
  Database,
  BarChart3,
  Users,
  TrendingUp,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'Razonamiento con IA',
    description:
      'Chain-of-thought reasoning analiza cada mensaje antes de responder. Entiende intención, detecta objeciones y personaliza la respuesta.',
    tech: 'generateReasoning()',
    color: 'from-purple-500/20 to-purple-500/5',
  },
  {
    icon: Calendar,
    title: 'Agenda Automática',
    description:
      'Integración nativa con Cal.com. Detecta interés, ofrece horarios disponibles y agenda demos sin intervención humana.',
    tech: 'Cal.com API',
    color: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: RefreshCw,
    title: 'Follow-ups Inteligentes',
    description:
      'Secuencias automatizadas: recordatorios pre-demo, seguimiento post-demo, y re-engagement de leads fríos.',
    tech: 'Vercel Cron',
    color: 'from-green-500/20 to-green-500/5',
  },
  {
    icon: Target,
    title: 'Detección de Sentimiento',
    description:
      'Analiza el tono emocional del usuario en tiempo real. Adapta respuestas para frustrados, escépticos o entusiasmados.',
    tech: 'detectSentiment()',
    color: 'from-red-500/20 to-red-500/5',
  },
  {
    icon: Users,
    title: 'CRM Integrado',
    description:
      'Pipeline visual tipo Kanban. Ve cada lead en qué etapa está, historial completo de conversaciones y contexto centralizado.',
    tech: 'Built-in CRM',
    color: 'from-yellow-500/20 to-yellow-500/5',
  },
  {
    icon: TrendingUp,
    title: 'Meta Conversions API',
    description:
      'Tracking server-side que evita bloqueadores. Reporta conversiones reales a Meta para optimizar tus campañas y bajar el CPL.',
    tech: 'Meta CAPI',
    color: 'from-orange-500/20 to-orange-500/5',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />

      <div className="relative max-w-7xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-neon-subtle text-neon-green-dark text-sm font-medium rounded-full mb-4">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              No es un chatbot básico
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cada feature está diseñado para maximizar conversiones, no solo responder preguntas.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <FadeIn key={feature.title} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Card hover className="h-full group relative overflow-hidden">
                  {/* Gradient background on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  <div className="relative flex flex-col h-full">
                    <div className="w-14 h-14 rounded-xl bg-neon-subtle flex items-center justify-center mb-4 group-hover:bg-neon-green/20 group-hover:shadow-glow-sm transition-all duration-300">
                      <feature.icon className="w-7 h-7 text-neon-green-dark" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-4 flex-1 leading-relaxed">
                      {feature.description}
                    </p>
                    <code className="text-xs font-mono text-neon-green-dark bg-neon-subtle px-3 py-1.5 rounded-lg w-fit group-hover:bg-neon-green/20 transition-colors">
                      {feature.tech}
                    </code>
                  </div>
                </Card>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
