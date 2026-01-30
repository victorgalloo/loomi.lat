'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button-loomi';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

const PLANS = [
  {
    name: 'Starter',
    monthlyPrice: 199,
    yearlyPrice: 159,
    description: 'Hasta 100 mensajes/día',
    features: [
      'Agente IA conversacional',
      '1 número WhatsApp',
      'Memoria de contexto',
      'Agenda con Cal.com',
      'Soporte por email',
    ],
    cta: 'Comenzar ahora',
    highlight: false,
  },
  {
    name: 'Growth',
    monthlyPrice: 349,
    yearlyPrice: 279,
    description: 'Hasta 300 mensajes/día',
    features: [
      'Todo en Starter',
      '3 números WhatsApp',
      'IA entrenada con tu data',
      'CRM sync (HubSpot, etc.)',
      'Dashboard de analytics',
      'Soporte prioritario',
    ],
    cta: 'Comenzar ahora',
    highlight: true,
  },
  {
    name: 'Business',
    monthlyPrice: 599,
    yearlyPrice: 479,
    description: 'Hasta 1,000 mensajes/día',
    features: [
      'Todo en Growth',
      '10 números WhatsApp',
      'Integraciones avanzadas',
      'API access completo',
      'Onboarding dedicado',
      'SLA 99.9%',
    ],
    cta: 'Comenzar ahora',
    highlight: false,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    yearlyPrice: null,
    description: 'Volumen ilimitado',
    features: [
      'Todo en Business',
      'Números ilimitados',
      'Desarrollo a medida',
      'Opción self-hosted',
      'Account manager',
      'SLA personalizado',
    ],
    cta: 'Hablar con ventas',
    highlight: false,
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-28 sm:py-40 px-4 sm:px-6 relative overflow-hidden bg-background transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-green/3 blur-[200px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6"
          >
            Elige tu plan.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted mb-10"
          >
            Paga por conversaciones, no por mensajes. Cancela cuando quieras.
          </motion.p>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-4 p-1 rounded-full bg-surface border border-border"
          >
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isYearly ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'
              }`}
            >
              Anual
              <span className={`text-xs px-2 py-0.5 rounded-full ${isYearly ? 'bg-neon-green text-gray-900' : 'bg-neon-green/20 text-neon-green'}`}>
                -20%
              </span>
            </button>
          </motion.div>
        </div>

        {/* Plans - Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative group ${plan.highlight ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {/* Highlight indicator */}
              {plan.highlight && (
                <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green rounded-t-full" />
              )}

              <div className={`h-full p-6 xl:p-8 rounded-2xl transition-all duration-300 ${
                plan.highlight
                  ? 'bg-surface border-2 border-neon-green/30'
                  : 'bg-surface border border-border hover:border-muted'
              }`}>
                {/* Plan header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    {plan.highlight && (
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-neon-green/10 text-neon-green rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {plan.monthlyPrice ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl xl:text-5xl font-bold text-foreground">
                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted text-sm">USD/mes</span>
                    </div>
                  ) : (
                    <div className="text-3xl xl:text-4xl font-bold text-foreground">
                      Custom
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + i * 0.05 }}
                      className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-neon-green' : 'text-muted'}`} />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA */}
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="block">
                  <Button
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    className="w-full group/btn"
                    glow={plan.highlight}
                  >
                    {plan.highlight && <MessageCircle className="w-4 h-4 mr-2" />}
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted text-sm mt-12"
        >
          Todos los planes incluyen 14 días de prueba gratis. Sin tarjeta de crédito.
        </motion.p>
      </div>
    </section>
  );
}
