"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Store, TrendingUp, AlertCircle, BarChart3, Users, Package, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RetailPage() {
  const benefits = [
    {
      icon: BarChart3,
      title: "Análisis de Ventas en Tiempo Real",
      description: "Consulta el rendimiento de cualquier punto de venta, producto o categoría al instante. Identifica tendencias y patrones de compra sin esperar reportes mensuales.",
    },
    {
      icon: TrendingUp,
      title: "Optimización de Inventario",
      description: "Prevén desabastos y excesos de stock con predicciones basadas en datos históricos y tendencias estacionales. Reduce costos de almacenamiento y maximiza rotación.",
    },
    {
      icon: Users,
      title: "Análisis de Comportamiento del Cliente",
      description: "Entiende qué productos se venden juntos, cuándo y dónde. Identifica oportunidades de cross-selling y personalización de ofertas por ubicación.",
    },
    {
      icon: DollarSign,
      title: "Gestión de Rentabilidad",
      description: "Analiza márgenes de ganancia por producto, categoría y punto de venta. Identifica qué áreas generan más valor y dónde optimizar precios.",
    },
  ];

  const decisions = [
    {
      icon: CheckCircle2,
      title: "Estrategias de Precio Dinámicas",
      description: "Ajusta precios según demanda, competencia local y temporada en tiempo real, maximizando rentabilidad sin perder competitividad.",
    },
    {
      icon: CheckCircle2,
      title: "Optimización de Ubicaciones",
      description: "Identifica las mejores ubicaciones para nuevos puntos de venta basándote en datos demográficos, competencia y comportamiento de compra.",
    },
    {
      icon: CheckCircle2,
      title: "Prevención de Pérdidas",
      description: "Detecta anomalías en ventas, inventarios y transacciones que puedan indicar robos, errores administrativos o problemas operativos.",
    },
    {
      icon: CheckCircle2,
      title: "Gestión de Promociones",
      description: "Evalúa el impacto real de campañas promocionales y optimiza descuentos para maximizar ventas sin afectar márgenes.",
    },
  ];

  const exampleQueries = [
    "¿Qué productos tienen mayor rotación en puntos de venta del sur?",
    "Compara el rendimiento de ventas entre esta temporada y la misma del año pasado",
    "Muestra los puntos de venta con mayor margen de ganancia",
    "¿Cuáles son los productos que más se venden juntos en línea?",
    "Identifica categorías con tendencia a quedarse sin inventario",
    "Analiza el comportamiento de compra por franja horaria y día de la semana",
  ];

  return (
    <main className="relative z-10 flex min-h-screen flex-col" style={{ background: "linear-gradient(135deg, #e8eaf6 0%, #f5f5f5 50%, #e3f2fd 100%)", transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}>
      {/* Header */}
      <header className="flex w-full items-center justify-between px-8 py-6 md:px-16">
        <div className="flex items-end gap-3">
          <Link href="/syntra">
            <img 
              src="/assets/icons/Syntra hor no bg lightmode.svg" 
              alt="Syntra" 
              className="h-10 w-auto cursor-pointer"
            />
          </Link>
          <div className="mb-0.5 flex items-center gap-1.5">
            <span className="text-[9px] font-medium text-muted-foreground">powered by</span>
            <img 
              src="/assets/icons/databricks1.svg" 
              alt="Databricks" 
              className="h-2.5 w-auto"
            />
          </div>
        </div>
        <Link href="/syntra">
          <Button variant="outline" size="sm" className="rounded-full border-black/10">
            Volver
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-8 py-20 text-center md:px-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100">
              <Store className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl font-bold leading-tight tracking-tight text-base-foreground md:text-6xl lg:text-7xl"
          >
            Retail y Puntos de Venta
            <br />
            <span className="bg-gradient-to-r from-primary via-[#FF9E62] to-[#AA2801] bg-clip-text text-transparent">
              Optimiza tu negocio minorista
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            Transforma los datos de ventas, inventario y clientes en decisiones estratégicas que impulsan el crecimiento y la rentabilidad de tu operación retail.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center gap-4 pt-4"
          >
            <Link href="/#contact">
              <Button 
                size="lg" 
                className="group h-14 rounded-full bg-primary px-8 text-base font-semibold text-white shadow-[0_8px_24px_rgba(255,159,50,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(255,159,50,0.4)] hover:bg-primary/90"
              >
                Solicitar Demo
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Overview Section */}
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
              <h2 className="text-3xl font-bold text-base-foreground md:text-4xl lg:text-5xl">
                El Desafío del Retail Moderno
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
                En un mercado cada vez más competitivo, los retailers necesitan acceso inmediato a insights sobre ventas, inventarios, comportamiento del cliente y rendimiento por ubicación. Los reportes tradicionales no son suficientes cuando necesitas tomar decisiones en tiempo real.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
                Syntra elimina las barreras técnicas, permitiendo que cualquier miembro de tu equipo haga preguntas directas sobre tu operación y reciba respuestas instantáneas basadas en datos reales.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl"
            >
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
                alt="Tienda retail moderna"
                className="h-full w-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* What Syntra Provides Section */}
      <section className="border-t border-black/5 bg-gradient-to-b from-white to-base px-8 py-20 md:px-16">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl font-bold text-base-foreground md:text-5xl lg:text-6xl">
              Qué te brinda Syntra para Retail
            </h2>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Herramientas poderosas diseñadas específicamente para las necesidades del retail moderno
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 overflow-hidden rounded-3xl shadow-2xl"
          >
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80"
              alt="Análisis de datos de retail"
              className="h-[400px] w-full object-cover md:h-[500px]"
            />
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl transition-all hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative space-y-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                      <IconComponent className="h-7 w-7 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-base-foreground">{benefit.title}</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Decisions and Prevention Section */}
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
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80"
                alt="Decisión estratégica en retail"
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
              <h2 className="text-4xl font-bold text-base-foreground md:text-5xl lg:text-6xl">
                Decisiones y Prevención que Tomas Mejor con Syntra
              </h2>
              <p className="text-lg text-muted-foreground md:text-xl">
                Anticipa problemas y optimiza tu operación con insights accionables en tiempo real
              </p>
            </motion.div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {decisions.map((decision, index) => {
              const IconComponent = decision.icon;
              return (
                <motion.div
                  key={decision.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl transition-all hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
                        <IconComponent className="h-7 w-7 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-base-foreground">{decision.title}</h3>
                    </div>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {decision.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Example Queries Section */}
      <section className="border-t border-black/5 px-8 py-20 md:px-16">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl font-bold text-base-foreground md:text-5xl lg:text-6xl">
              Ejemplos de Consultas
            </h2>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Pregunta en lenguaje natural y obtén respuestas instantáneas
            </p>
          </motion.div>

          <div className="space-y-4">
            {exampleQueries.map((query, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <p className="text-base font-medium text-base-foreground">{query}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-black/5 px-8 py-20 md:px-16">
        <div className="liquid-glass-gradient ambient-glow mx-auto max-w-4xl rounded-[40px] border border-white/40 p-12 text-center md:p-16" style={{ transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold text-base-foreground md:text-4xl lg:text-5xl">
              ¿Listo para transformar tu operación retail?
            </h2>
            <p className="text-lg text-muted-foreground md:text-xl">
              Descubre cómo Syntra puede ayudar a tu equipo a tomar mejores decisiones basadas en datos
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/#contact">
                <Button 
                  size="lg" 
                  className="group h-14 rounded-full bg-primary px-8 text-base font-semibold text-white shadow-[0_8px_24px_rgba(255,159,50,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(255,159,50,0.4)] hover:bg-primary/90"
                >
                  Solicitar Demo
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/syntra">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-full border-black/10 px-8 text-base font-semibold"
                >
                  Ver más casos de uso
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 px-8 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          © 2024 Syntra. Powered by Databricks. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

