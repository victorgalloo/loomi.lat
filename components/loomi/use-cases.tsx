'use client';

import { motion } from 'framer-motion';
import { Monitor, ShoppingCart, Stethoscope, Briefcase } from 'lucide-react';

const USE_CASES = [
  {
    icon: Monitor,
    name: 'SaaS',
    description: 'Califica leads, agenda demos y reduce churn con follow-ups automáticos.',
    metric: '+340% demos',
  },
  {
    icon: ShoppingCart,
    name: 'Ecommerce',
    description: 'Atiende consultas, envía links de pago y recupera carritos.',
    metric: '+28% conversión',
  },
  {
    icon: Stethoscope,
    name: 'Clínicas',
    description: 'Agenda citas, envía recordatorios y reduce no-shows.',
    metric: '-78% no-shows',
  },
  {
    icon: Briefcase,
    name: 'Consultoras',
    description: 'Filtra prospectos por presupuesto antes de la primera llamada.',
    metric: '85% calificados',
  },
];

export function UseCases() {
  return (
    <section className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background">
      <div className="relative max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground mb-20 text-center"
        >
          Para cualquier industria
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden">
          {USE_CASES.map((useCase, index) => (
            <motion.div
              key={useCase.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="p-8 bg-background group cursor-default transition-colors duration-200 hover:bg-surface"
            >
              <motion.div
                className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-6"
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
              >
                <useCase.icon className="w-6 h-6 text-foreground" />
              </motion.div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                {useCase.name}
              </h3>

              <p className="text-muted text-sm leading-relaxed mb-6">
                {useCase.description}
              </p>

              <span className="font-mono text-terminal-green text-sm font-semibold group-hover:drop-shadow-[0_0_8px_rgba(39,201,63,0.4)] transition-all duration-300">
                {useCase.metric}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
