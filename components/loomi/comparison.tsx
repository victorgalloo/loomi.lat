'use client';

import { Check, X, Bot, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/ui/fade-in';
import { motion } from 'framer-motion';

interface ComparisonRow {
  chatbot: string;
  agent: string;
}

const COMPARISON_DATA: ComparisonRow[] = [
  { chatbot: 'Flujos predefinidos', agent: 'Conversación natural' },
  { chatbot: 'Respuestas fijas', agent: 'Razonamiento contextual' },
  { chatbot: 'Sin memoria', agent: 'Memoria de largo plazo' },
  { chatbot: 'Setup manual', agent: 'Aprende del negocio' },
  { chatbot: 'Requiere programación', agent: 'Se adapta solo' },
];

export function Comparison() {
  return (
    <section id="comparison" className="py-28 sm:py-40 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand/3 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            >
              Un agente de IA no es un bot de flujos.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted max-w-2xl mx-auto"
            >
              Es una categoría completamente diferente.
            </motion.p>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="bg-surface rounded-3xl border border-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-2 border-b border-border">
              <div className="p-6 sm:p-8 bg-red-500/5 border-r border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Chatbot tradicional</h3>
                    <p className="text-sm text-muted">Wati, Manychat, etc.</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8 bg-brand/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Agente IA</h3>
                    <p className="text-sm text-brand">Loomi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rows */}
            {COMPARISON_DATA.map((row, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'grid grid-cols-2',
                  index !== COMPARISON_DATA.length - 1 && 'border-b border-border'
                )}
              >
                <div className="p-5 sm:p-6 flex items-center gap-3 border-r border-border bg-red-500/5">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-foreground/70">{row.chatbot}</span>
                </div>
                <div className="p-5 sm:p-6 flex items-center gap-3 bg-brand/5">
                  <Check className="w-5 h-5 text-brand flex-shrink-0" />
                  <span className="text-foreground font-medium">{row.agent}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        {/* ROI callout */}
        <FadeIn delay={0.4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-8 rounded-2xl bg-surface border border-border text-center"
          >
            <p className="text-lg text-muted mb-2">
              Un vendedor humano cuesta <span className="text-foreground font-semibold">$800-1,500 USD/mes</span> en LATAM
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              Tu agente trabaja 24/7 y atiende <span className="text-brand">100+ chats</span> simultáneos
            </p>
            <p className="text-muted mt-4">
              Con 2-3 cierres al mes, el cliente ya recuperó su inversión.
            </p>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  );
}
