"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Truck, MapPin, Clock, Package, Route, CheckCircle2, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LogisticaPage() {
  const benefits = [
    {
      icon: Route,
      title: "Optimización de Rutas en Tiempo Real",
      description: "Consulta el estado de entregas, tiempos de tránsito y eficiencia de rutas al instante. Identifica oportunidades de optimización y reduce costos de transporte.",
    },
    {
      icon: Package,
      title: "Gestión de Inventarios y Almacenes",
      description: "Monitorea niveles de inventario, rotación y ubicación de productos en múltiples almacenes. Prevén desabastos y optimiza el uso del espacio de almacenamiento.",
    },
    {
      icon: Clock,
      title: "Análisis de Tiempos de Entrega",
      description: "Analiza tiempos de ciclo desde orden hasta entrega. Identifica cuellos de botella y optimiza procesos para mejorar la satisfacción del cliente.",
    },
    {
      icon: Zap,
      title: "Reducción de Costos Operativos",
      description: "Identifica oportunidades de ahorro en transporte, almacenamiento y manejo. Optimiza el uso de recursos y reduce desperdicios operativos.",
    },
  ];

  const decisions = [
    {
      icon: CheckCircle2,
      title: "Prevención de Retrasos en Entregas",
      description: "Detecta riesgos de retraso basándote en patrones históricos, condiciones de tráfico y capacidad actual. Intervén proactivamente para cumplir compromisos.",
    },
    {
      icon: CheckCircle2,
      title: "Optimización de Red de Distribución",
      description: "Evalúa la ubicación de almacenes y centros de distribución basándote en demanda, tiempos de entrega y costos. Optimiza tu red logística.",
    },
    {
      icon: CheckCircle2,
      title: "Gestión de Capacidad y Recursos",
      description: "Planifica capacidad de transporte y almacenamiento considerando demanda esperada, estacionalidad y restricciones operativas. Maximiza eficiencia.",
    },
    {
      icon: CheckCircle2,
      title: "Control de Calidad en Cadena de Suministro",
      description: "Monitorea condiciones de transporte, manejo y almacenamiento que puedan afectar la calidad de productos. Prevén daños y pérdidas.",
    },
  ];

  const exampleQueries = [
    "¿Qué rutas tienen mayor tiempo promedio de entrega este mes?",
    "Compara la eficiencia de uso de almacenes entre regiones",
    "Muestra los productos con mayor riesgo de desabasto en próximas 2 semanas",
    "¿Cuáles son las rutas más costosas por kilómetro recorrido?",
    "Identifica patrones de retrasos por zona geográfica y día de la semana",
    "Analiza el impacto de condiciones climáticas en tiempos de entrega",
  ];

  return (
    <main className="relative z-10 flex min-h-screen flex-col" style={{ background: "linear-gradient(135deg, #e8eaf6 0%, #f5f5f5 50%, #e3f2fd 100%)", transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}>
      <header className="flex w-full items-center justify-between px-8 py-6 md:px-16">
        <div className="flex items-end gap-3">
          <Link href="/syntra"><img src="/assets/icons/Syntra hor no bg lightmode.svg" alt="Syntra" className="h-10 w-auto cursor-pointer" /></Link>
          <div className="mb-0.5 flex items-center gap-1.5"><span className="text-[9px] font-medium text-muted-foreground">powered by</span><img src="/assets/icons/databricks1.svg" alt="Databricks" className="h-2.5 w-auto" /></div>
        </div>
        <Link href="/syntra"><Button variant="outline" size="sm" className="rounded-full border-black/10">Volver</Button></Link>
      </header>
      <section className="flex flex-1 flex-col items-center justify-center px-8 py-20 text-center md:px-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100"><Truck className="h-8 w-8 text-orange-600" /></div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-5xl font-bold leading-tight tracking-tight text-base-foreground md:text-6xl lg:text-7xl">
            Logística<br />
            <span className="bg-gradient-to-r from-primary via-[#FF9E62] to-[#AA2801] bg-clip-text text-transparent">Optimiza tus operaciones logísticas con inteligencia de datos</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Transforma los datos de transporte, almacenamiento y distribución en decisiones que mejoran la eficiencia, reducen costos y elevan la satisfacción del cliente.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col items-center gap-4 pt-4">
            <Link href="/#contact"><Button size="lg" className="group h-14 rounded-full bg-primary px-8 text-base font-semibold text-white shadow-[0_8px_24px_rgba(255,159,50,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(255,159,50,0.4)] hover:bg-primary/90">Solicitar Demo<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Button></Link>
          </motion.div>
        </div>
      </section>
      <section className="border-t border-black/5 px-8 py-20 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-base-foreground md:text-4xl lg:text-5xl">El Desafío de la Logística Moderna</h2>
              <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">Las operaciones logísticas requieren coordinación compleja entre transporte, almacenamiento y distribución. Convertir datos de múltiples sistemas en decisiones optimizadas es crucial para la competitividad.</p>
              <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">Syntra permite que tu equipo pregunte directamente sobre rutas, inventarios y entregas, recibiendo respuestas instantáneas que permiten optimizar operaciones en tiempo real.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl"
            >
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80"
                alt="Almacén y logística moderna"
                className="h-full w-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>
      <section className="border-t border-black/5 bg-gradient-to-b from-white to-base px-8 py-20 md:px-16">
        <div className="mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-base-foreground md:text-5xl lg:text-6xl">Qué te brinda Syntra para Logística</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 overflow-hidden rounded-3xl shadow-2xl"
          >
            <img
              src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=1200&q=80"
              alt="Optimización de rutas y transporte"
              className="h-[400px] w-full object-cover md:h-[500px]"
            />
          </motion.div>
          <div className="grid gap-8 md:grid-cols-2">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <motion.div key={benefit.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl transition-all hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative space-y-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-orange-100"><IconComponent className="h-7 w-7 text-orange-600" /></div>
                    <h3 className="text-2xl font-bold text-base-foreground">{benefit.title}</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">{benefit.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="border-t border-black/5 bg-gradient-to-b from-base to-white px-8 py-20 md:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl order-2 md:order-1"
            >
              <img
                src="https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80"
                alt="Gestión de inventario y distribución"
                className="h-full w-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6 order-1 md:order-2"
            >
              <h2 className="text-4xl font-bold text-base-foreground md:text-5xl lg:text-6xl">Decisiones y Prevención que Tomas Mejor con Syntra</h2>
            </motion.div>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {decisions.map((decision, index) => {
              const IconComponent = decision.icon;
              return (
                <motion.div key={decision.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} className="group relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl transition-all hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100"><IconComponent className="h-7 w-7 text-emerald-600" /></div>
                      <h3 className="text-xl font-bold text-base-foreground">{decision.title}</h3>
                    </div>
                    <p className="text-base leading-relaxed text-muted-foreground">{decision.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="border-t border-black/5 px-8 py-20 md:px-16">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-base-foreground md:text-5xl lg:text-6xl">Ejemplos de Consultas</h2>
          </motion.div>
          <div className="space-y-4">
            {exampleQueries.map((query, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <p className="text-base font-medium text-base-foreground">{query}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-black/5 px-8 py-20 md:px-16">
        <div className="liquid-glass-gradient ambient-glow mx-auto max-w-4xl rounded-[40px] border border-white/40 p-12 text-center md:p-16" style={{ transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-8">
            <h2 className="text-3xl font-bold text-base-foreground md:text-4xl lg:text-5xl">¿Listo para optimizar tu operación logística?</h2>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/#contact"><Button size="lg" className="group h-14 rounded-full bg-primary px-8 text-base font-semibold text-white shadow-[0_8px_24px_rgba(255,159,50,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(255,159,50,0.4)] hover:bg-primary/90">Solicitar Demo<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Button></Link>
              <Link href="/syntra"><Button size="lg" variant="outline" className="h-14 rounded-full border-black/10 px-8 text-base font-semibold">Ver más casos de uso</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>
      <footer className="border-t border-black/5 px-8 py-8 text-center"><p className="text-sm text-muted-foreground">© 2024 Syntra. Powered by Databricks. All rights reserved.</p></footer>
    </main>
  );
}

