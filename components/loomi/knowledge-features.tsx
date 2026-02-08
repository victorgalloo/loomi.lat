'use client';

import { motion } from 'framer-motion';
import { Brain, DollarSign, Trophy, Database, Zap, Shield } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'Base de Conocimiento',
    description: 'El agente accede a tu FAQ personalizado en tiempo real. Responde preguntas complejas con información actualizada.',
    technical: 'PostgreSQL + búsqueda semántica',
    benefit: 'Respuestas precisas 24/7',
    colorClass: 'brand',
  },
  {
    icon: DollarSign,
    title: 'Precios Dinámicos',
    description: 'Cotiza automáticamente según el volumen del cliente. Starter, Growth, Business o Enterprise.',
    technical: 'Pricing tiers + lógica de volumen',
    benefit: 'Cotizaciones instantáneas',
    colorClass: 'brand',
  },
  {
    icon: Trophy,
    title: 'Casos de Éxito',
    description: 'Comparte casos de éxito relevantes según la industria del lead. Social proof que convierte.',
    technical: 'Filtrado por industria + PDF assets',
    benefit: '+34% conversión con social proof',
    colorClass: 'brand',
  },
];

const TECH_SPECS = [
  { icon: Database, label: 'Supabase', desc: 'PostgreSQL serverless' },
  { icon: Zap, label: '<100ms', desc: 'Latencia de consulta' },
  { icon: Shield, label: 'RLS', desc: 'Row Level Security' },
];

export function KnowledgeFeatures() {
  return (
    <section className="py-28 sm:py-40 px-4 sm:px-6 relative overflow-hidden bg-background transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-brand/3 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 text-sm text-muted/80 tracking-wide uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-brand" />
            Knowledge Tools
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Un agente que{' '}
            <span className="text-brand">
              sabe todo.
            </span>
          </h2>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            No es un chatbot con respuestas genéricas. Es un agente con acceso a tu base de conocimiento, precios y casos de éxito.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              <div className="h-full p-8 rounded-2xl bg-surface border border-border hover:border-border/80 transition-all duration-300">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-${feature.colorClass}/10 flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-7 h-7 text-${feature.colorClass}`} />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted mb-6">
                  {feature.description}
                </p>

                {/* Tags */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full bg-${feature.colorClass}`} />
                    <span className="text-sm font-mono text-muted/70">{feature.technical}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full bg-${feature.colorClass}`} />
                    <span className={`text-sm font-semibold text-${feature.colorClass}`}>{feature.benefit}</span>
                  </div>
                </div>

                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-2xl bg-${feature.colorClass}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Technical Architecture */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="p-8 sm:p-12 rounded-2xl bg-surface border border-border">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Diagram */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Arquitectura de conocimiento
                </h3>

                {/* Flow diagram */}
                <div className="space-y-3">
                  {[
                    { step: '1', text: 'Lead pregunta sobre precios', color: 'brand' },
                    { step: '2', text: 'Agente detecta intent "PRICING"', color: 'brand' },
                    { step: '3', text: 'Consulta pricing_tiers en Supabase', color: 'brand' },
                    { step: '4', text: 'Responde con precio personalizado', color: 'brand' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className={`w-8 h-8 rounded-full bg-${item.color}/20 flex items-center justify-center text-sm font-mono text-${item.color}`}>
                        {item.step}
                      </div>
                      <span className="text-foreground/80">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right - Code snippet */}
              <div className="relative rounded-2xl overflow-hidden bg-background border border-border">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20" />
                  </div>
                  <span className="text-xs text-muted/60 ml-2">knowledge.ts</span>
                </div>
                <div className="p-4 font-mono text-xs leading-6 overflow-hidden">
                  <div className="text-muted/50">// Búsqueda en knowledge base</div>
                  <div>
                    <span className="text-violet-400">const</span>
                    {' '}results = <span className="text-violet-400">await</span> supabase
                  </div>
                  <div className="pl-4">
                    .from(<span className="text-brand">'knowledge_base'</span>)
                  </div>
                  <div className="pl-4">
                    .select(<span className="text-brand">'question, answer'</span>)
                  </div>
                  <div className="pl-4">
                    .ilike(<span className="text-brand">'question'</span>, query)
                  </div>
                  <div className="pl-4">
                    .limit(<span className="text-amber-400">3</span>)
                  </div>
                  <div className="mt-4 text-muted/50">// Respuesta en {'<'}100ms</div>
                </div>
              </div>
            </div>

            {/* Tech specs footer */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-border">
              {TECH_SPECS.map((spec, i) => (
                <motion.div
                  key={spec.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <spec.icon className="w-5 h-5 text-brand" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{spec.label}</div>
                    <div className="text-xs text-muted">{spec.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
