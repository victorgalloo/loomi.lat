'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Server, Lock, Check, X } from 'lucide-react';
import Image from 'next/image';

const STACK = [
  { name: 'WhatsApp Cloud API', desc: 'Directo, sin intermediarios', logo: '/logos/whatsapp.svg' },
  { name: 'Meta Conversions API', desc: 'Tracking server-side completo', logo: '/logos/meta-logo.png' },
  { name: 'Stripe', desc: 'Pagos integrados', logo: '/logos/stripe.svg' },
  { name: 'Supabase', desc: 'Base de datos en tiempo real', logo: '/logos/supabase.svg' },
  { name: 'Vercel', desc: 'Deploy edge global', logo: '/logos/vercel.svg' },
  { name: 'Claude AI', desc: 'Razonamiento avanzado', logo: '/logos/claude.svg' },
];

const TECH_PROVIDER_BENEFITS = [
  'Conectas cuentas de WhatsApp Business de clientes directo',
  'No dependes de BSP terceros (Twilio, 360dialog)',
  'Margen completo para ti',
  'Coexistencia: WhatsApp App + API simultáneo',
  'Control total de la cadena',
];

const VS_COMPETITION = [
  { feature: 'Responde mensajes', others: true, loomi: true },
  { feature: 'Memoria contextual', others: false, loomi: true },
  { feature: 'Agenda automática', others: false, loomi: true },
  { feature: 'Meta Conversions API', others: false, loomi: true },
  { feature: 'Tech Provider directo', others: false, loomi: true },
  { feature: 'Pagos integrados', others: false, loomi: true },
];

export function TechProvider() {
  return (
    <section className="py-28 sm:py-40 px-4 sm:px-6 relative overflow-hidden bg-background transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-neon-cyan/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 bg-neon-cyan/10 text-neon-cyan text-sm font-medium rounded-full mb-6">
            Tech Provider de Meta
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Esto no es un juguete.
            <br />
            <span className="text-muted">Es infraestructura real.</span>
          </h2>
        </motion.div>

        {/* Stack Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h3 className="text-xl font-bold text-foreground text-center mb-8">
            Stack técnico construido en 1 semana
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {STACK.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-surface border border-border text-center group hover:border-neon-green/30 transition-colors"
              >
                <div className="w-10 h-10 mx-auto mb-3 relative opacity-60 group-hover:opacity-100 transition-opacity">
                  <Image
                    src={tech.logo}
                    alt={tech.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{tech.name}</p>
                <p className="text-xs text-muted">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Two columns: Tech Provider benefits + Comparison */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {/* Tech Provider Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-surface border border-neon-cyan/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-neon-cyan" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Tech Provider</h3>
                <p className="text-sm text-muted">Tu ventaja competitiva</p>
              </div>
            </div>

            <p className="text-muted mb-6">
              Ser Tech Provider de Meta significa que no dependes de nadie. Tú controlas toda la cadena.
            </p>

            <ul className="space-y-3">
              {TECH_PROVIDER_BENEFITS.map((benefit, i) => (
                <motion.li
                  key={benefit}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{benefit}</span>
                </motion.li>
              ))}
            </ul>

            <div className="mt-6 p-4 rounded-lg bg-neon-cyan/5 border border-neon-cyan/10">
              <p className="text-sm text-neon-cyan">
                Esto es una barrera de entrada. No cualquiera tiene esto.
              </p>
            </div>
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-surface border border-border"
          >
            <h3 className="text-xl font-bold text-foreground mb-6">
              Loomi vs Chatbots en LATAM
            </h3>

            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-3 gap-2 pb-3 border-b border-border">
                <div className="text-sm text-muted">Feature</div>
                <div className="text-sm text-muted text-center">Otros</div>
                <div className="text-sm text-neon-green text-center">Loomi</div>
              </div>

              {/* Rows */}
              {VS_COMPETITION.map((row, i) => (
                <motion.div
                  key={row.feature}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-3 gap-2 py-3 border-b border-border/50"
                >
                  <div className="text-sm text-foreground">{row.feature}</div>
                  <div className="flex justify-center">
                    {row.others ? (
                      <Check className="w-4 h-4 text-muted" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex justify-center">
                    <Check className="w-4 h-4 text-neon-green" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom: Business Numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-r from-neon-green/5 via-surface to-neon-cyan/5 border border-border"
        >
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            El negocio real en números
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-muted font-medium">Métrica</th>
                  <th className="text-center py-3 text-red-400 font-medium">Sin Loomi</th>
                  <th className="text-center py-3 text-neon-green font-medium">Con Loomi</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: 'Leads/semana', without: '100', with: '100' },
                  { metric: 'Respuesta en <5 min', without: '20%', with: '100%' },
                  { metric: 'Leads calificados', without: 'No saben', with: '40' },
                  { metric: 'Citas agendadas', without: '5-10 manual', with: '15-25 auto' },
                  { metric: 'Costo por lead Meta', without: 'Se mantiene', with: 'Baja con el tiempo' },
                  { metric: 'Data para optimizar', without: 'Nada', with: 'Eventos reales' },
                ].map((row, i) => (
                  <tr key={row.metric} className="border-b border-border/50">
                    <td className="py-3 text-foreground">{row.metric}</td>
                    <td className="py-3 text-center text-muted">{row.without}</td>
                    <td className="py-3 text-center text-neon-green font-medium">{row.with}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted mb-2">
              Si una agencia maneja 10 clientes y cada uno paga $200-500 USD/mes por Loomi:
            </p>
            <p className="text-3xl font-bold text-foreground">
              $2,000 - $5,000 <span className="text-neon-green">USD/mes</span> por agencia
            </p>
            <p className="text-muted mt-2">
              Con 5 agencias ya estás en <span className="text-neon-green font-bold">$10,000 - $25,000 USD/mes</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
