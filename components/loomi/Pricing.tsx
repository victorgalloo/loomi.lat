'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button-loomi';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

const PLANS = [
  {
    name: 'starter',
    monthlyPrice: 199,
    yearlyPrice: 159,
    msgs: '100 msgs/día',
    features: ['1 WhatsApp', 'Agente IA', 'Cal.com'],
  },
  {
    name: 'growth',
    monthlyPrice: 349,
    yearlyPrice: 279,
    msgs: '300 msgs/día',
    features: ['3 WhatsApp', 'CRM Kanban', 'Meta CAPI', 'Analytics'],
    highlight: true,
  },
  {
    name: 'business',
    monthlyPrice: 599,
    yearlyPrice: 479,
    msgs: '1,000 msgs/día',
    features: ['10 WhatsApp', 'API access', 'Onboarding', 'SLA 99.9%'],
  },
  {
    name: 'enterprise',
    monthlyPrice: null,
    yearlyPrice: null,
    msgs: 'ilimitado',
    features: ['WhatsApp ilimitados', 'Self-hosted', 'Account manager'],
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background">
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground mb-8 font-mono"
          >
            Precios
          </motion.h2>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-4 font-mono"
          >
            <button
              onClick={() => setIsYearly(false)}
              className={`text-lg ${!isYearly ? 'text-foreground font-bold' : 'text-muted'}`}
            >
              mensual
            </button>
            <div
              onClick={() => setIsYearly(!isYearly)}
              className={`w-14 h-8 rounded-full cursor-pointer ${isYearly ? 'bg-foreground' : 'bg-border'}`}
            >
              <motion.div
                className="w-6 h-6 rounded-full bg-background mt-1"
                animate={{ x: isYearly ? 30 : 4 }}
              />
            </div>
            <button
              onClick={() => setIsYearly(true)}
              className={`text-lg flex items-center gap-2 ${isYearly ? 'text-foreground font-bold' : 'text-muted'}`}
            >
              anual
              <span className="text-sm px-2 py-1 rounded bg-terminal-green/10 text-terminal-green">-20%</span>
            </button>
          </motion.div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 ${plan.highlight ? 'bg-foreground text-background' : 'bg-background'}`}
            >
              {plan.highlight && (
                <span className="absolute top-4 right-4 text-xs font-mono px-3 py-1 rounded-full bg-background text-foreground">
                  popular
                </span>
              )}

              <h3 className={`text-xl font-bold font-mono mb-1 ${plan.highlight ? 'text-background' : 'text-foreground'}`}>
                ./{plan.name}
              </h3>
              <p className={`text-sm font-mono mb-6 ${plan.highlight ? 'text-background/60' : 'text-muted'}`}>
                {plan.msgs}
              </p>

              <div className="mb-6">
                {plan.monthlyPrice ? (
                  <div className="font-mono">
                    <span className={`text-4xl font-black ${plan.highlight ? 'text-background' : 'text-foreground'}`}>
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className={plan.highlight ? 'text-background/60' : 'text-muted'}>/mes</span>
                  </div>
                ) : (
                  <span className={`text-3xl font-black font-mono ${plan.highlight ? 'text-background' : 'text-foreground'}`}>
                    custom
                  </span>
                )}
              </div>

              <ul className="space-y-2 mb-8 font-mono">
                {plan.features.map((feature) => (
                  <li key={feature} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-background/80' : 'text-muted'}`}>
                    <Check className={`w-4 h-4 ${plan.highlight ? 'text-background' : 'text-foreground'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="block">
                <Button
                  variant={plan.highlight ? 'secondary' : 'primary'}
                  className={`w-full font-mono ${plan.highlight ? 'bg-background text-foreground' : ''}`}
                >
                  {plan.highlight && <MessageCircle className="w-4 h-4 mr-2" />}
                  Empezar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted text-lg mt-12 font-mono"
        >
          14 días gratis · sin tarjeta
        </motion.p>
      </div>
    </section>
  );
}
