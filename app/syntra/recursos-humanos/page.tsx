"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Users, UserPlus, TrendingUp, Award, Clock, CheckCircle2, Heart, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecursosHumanosPage() {
  const benefits = [
    {
      icon: UserPlus,
      title: "Análisis de Talento y Adquisición",
      description: "Consulta métricas de reclutamiento, tiempo de contratación y calidad de candidatos. Identifica canales de reclutamiento más efectivos y optimiza procesos de selección.",
    },
    {
      icon: TrendingUp,
      title: "Retención y Desarrollo de Talento",
      description: "Analiza tasas de rotación, factores de retención y satisfacción del empleado. Identifica señales tempranas de deserción y prevén pérdida de talento clave.",
    },
    {
      icon: Award,
      title: "Desempeño y Productividad",
      description: "Monitorea métricas de desempeño, productividad y engagement. Identifica patrones de alto rendimiento y oportunidades de desarrollo.",
    },
    {
      icon: Heart,
      title: "Bienestar y Cultura Organizacional",
      description: "Analiza indicadores de bienestar, satisfacción y cultura. Identifica áreas de mejora y mide el impacto de iniciativas de cultura organizacional.",
    },
  ];

  const decisions = [
    {
      icon: CheckCircle2,
      title: "Prevención de Rotación de Talento Clave",
      description: "Identifica empleados de alto valor con riesgo de salida basándote en patrones de comportamiento, satisfacción y mercado. Intervén proactivamente para retener talento.",
    },
    {
      icon: CheckCircle2,
      title: "Optimización de Estrategias de Reclutamiento",
      description: "Evalúa efectividad de canales, tiempos y procesos de reclutamiento. Optimiza presupuesto y recursos para maximizar calidad de contrataciones.",
    },
    {
      icon: CheckCircle2,
      title: "Desarrollo Estratégico de Talento",
      description: "Identifica necesidades de capacitación y desarrollo basándote en brechas de habilidades, objetivos organizacionales y trayectorias de carrera.",
    },
    {
      icon: CheckCircle2,
      title: "Gestión Proactiva de Compensación",
      description: "Analiza equidad salarial, competitividad en mercado y eficiencia de estructuras de compensación. Prevén problemas de retención y equidad.",
    },
  ];

  const exampleQueries = [
    "¿Cuáles son los departamentos con mayor tasa de rotación este año?",
    "Compara tiempos de contratación por canal de reclutamiento",
    "Muestra los factores más correlacionados con satisfacción del empleado",
    "¿Cuáles son las posiciones con mayor riesgo de deserción?",
    "Identifica patrones de desempeño alto y bajo por departamento",
    "Analiza el impacto de programas de desarrollo en retención y promoción",
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
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100"><Users className="h-8 w-8 text-indigo-600" /></div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-5xl font-bold leading-tight tracking-tight text-base-foreground md:text-6xl lg:text-7xl">
            Recursos Humanos<br />
            <span className="bg-gradient-to-r from-primary via-[#FF9E62] to-[#AA2801] bg-clip-text text-transparent">Transforma datos de talento en mejores resultados</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Transforma los datos de talento, desempeño y cultura organizacional en decisiones que mejoran la retención, productividad y satisfacción del empleado.
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
              <h2 className="text-3xl font-bold text-base-foreground md:text-4xl lg:text-5xl">El Desafío de la Gestión de Talento Moderna</h2>
              <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">Las organizaciones necesitan entender y optimizar el talento humano para competir. Convertir datos de empleados, desempeño y cultura en decisiones estratégicas es crucial para el éxito organizacional.</p>
              <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">Syntra permite que tu equipo pregunte directamente sobre talento, retención y desempeño, recibiendo respuestas instantáneas que informan estrategias de recursos humanos.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl"
            >
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                alt="Equipo de trabajo colaborativo"
                className="h-full w-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>
      <section className="border-t border-black/5 bg-gradient-to-b from-white to-base px-8 py-20 md:px-16">
        <div className="mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-base-foreground md:text-5xl lg:text-6xl">Qué te brinda Syntra para Recursos Humanos</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 overflow-hidden rounded-3xl shadow-2xl"
          >
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80"
              alt="Desarrollo de talento y crecimiento profesional"
              className="h-[400px] w-full object-cover md:h-[500px]"
            />
          </motion.div>
          <div className="grid gap-8 md:grid-cols-2">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <motion.div key={benefit.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl transition-all hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative space-y-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100"><IconComponent className="h-7 w-7 text-indigo-600" /></div>
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
                src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80"
                alt="Gestión de talento y retención"
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
            <h2 className="text-3xl font-bold text-base-foreground md:text-4xl lg:text-5xl">¿Listo para transformar tu gestión de talento?</h2>
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

