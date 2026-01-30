"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, User, Search, FileText, Database, Settings, Rocket, Server, Shield, Lock, Gauge, Store, Factory, Hospital, ClipboardCheck, Truck, Users, TrendingUp, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DiagnosisAnimation,
  ArchitectureAnimation,
  MigrationAnimation,
  ConfigurationAnimation,
  DeploymentAnimation
} from "@/components/animations/step-animations";
import {
  SecurityFeature,
  StackFeature,
  IsolationFeature,
  SpeedFeature
} from "@/components/animations/architecture-features";

// Chat Demo Component with animated conversation
const ChatDemo = () => {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);

  const conversation = [
    {
      role: "user" as const,
      text: "Dame todos los puntos de venta en Jalisco",
      delay: 0
    },
    {
      role: "assistant" as const,
      text: "Aquí están los puntos de venta activos en Jalisco:",
      delay: 1500,
      table: {
        headers: ["Punto de Venta", "Ciudad", "Ventas (3 meses)", "Estatus"],
        rows: [
          ["KYB-GDL-001", "Guadalajara", "$350,200.00", "Activo"],
          ["KYB-ZAP-001", "Zapopan", "$240,100.00", "Activo"],
          ["KYB-PVA-001", "Puerto Vallarta", "$190,000.00", "Bajo Rendimiento"]
        ]
      }
    },
    {
      role: "user" as const,
      text: "¿Cuál vendió más en los últimos 3 meses?",
      delay: 5000
    },
    {
      role: "assistant" as const,
      text: "El punto de venta con mayores ventas en los últimos 3 meses es KYB-GDL-001 (Guadalajara) con $350,200.00.",
      delay: 6500
    }
  ];

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    let resetTimer: NodeJS.Timeout;

    const startAnimation = () => {
      conversation.forEach((msg, index) => {
        const timer = setTimeout(() => {
          setVisibleMessages((prev) => [...prev, index]);
        }, msg.delay);
        timers.push(timer);
      });

      // Reset animation after 12 seconds
      resetTimer = setTimeout(() => {
        setVisibleMessages([]);
        timers.forEach(clearTimeout);
        // Restart animation after a brief pause
        setTimeout(() => {
          startAnimation();
        }, 500);
      }, 12000);
    };

    startAnimation();

    return () => {
      timers.forEach(clearTimeout);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, []);

  return (
    <div className="liquid-glass-gradient mx-auto max-w-4xl rounded-[40px] border border-white/40 p-8 md:p-12" style={{ transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full">
          <img 
            src="/assets/icons/Syntra hor no bg lightmode.svg" 
            alt="Syntra" 
            className="h-6 w-auto"
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-base-foreground">Syntra</h3>
          <p className="text-xs text-muted-foreground">En línea</p>
        </div>
      </div>

      <div className="flex min-h-[450px] max-h-[600px] flex-col gap-4 overflow-y-auto overflow-x-hidden px-2 py-4">
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((index) => {
            const message = conversation[index];
            if (!message) return null;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[24px] px-5 py-4 ${
                    message.role === "user"
                      ? "border border-primary/30 bg-gradient-to-br from-primary to-[#FF9E62] text-white shadow-[0_8px_24px_rgba(255,159,50,0.25)] [&_*]:text-white"
                      : "liquid-glass border border-white/30 text-base-foreground"
                  }`}
                >
                  {message.role === "user" ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0 text-white" />
                      <p className="text-[15px] leading-relaxed font-medium text-white">{message.text}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[15px] leading-relaxed">{message.text}</p>
                      {message.table && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-white/20 bg-white/40 backdrop-blur-sm">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-white/30 bg-white/30">
                                {message.table.headers.map((header, i) => (
                                  <th key={i} className="px-4 py-2.5 font-semibold text-base-foreground">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {message.table.rows.map((row, i) => (
                                <tr key={i} className="border-b border-white/15 last:border-0 hover:bg-white/20 transition-colors">
                                  {row.map((cell, j) => (
                                    <td key={j} className="px-4 py-2.5 text-[14px] text-base-foreground/80">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Thinking indicator when waiting for next message */}
        {visibleMessages.length > 0 && 
         visibleMessages.length < conversation.length && 
         conversation[visibleMessages.length]?.role === "assistant" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="liquid-glass flex items-center gap-2 rounded-[24px] border border-white/30 px-5 py-3" style={{ transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}>
              <div className="flex gap-1">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      ease: "easeInOut",
                      delay
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Analizando...</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Implementation Section with Interactive Scroll (Apple-style scroll hijacking)
const ImplementationSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSectionActive, setIsSectionActive] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const scrollProgressRef = useRef(0);

  const steps = [
    {
      id: 0,
      title: "Diagnóstico y Descubrimiento",
      description: "Iniciamos con una sesión estratégica para comprender a fondo tus necesidades de información y KPIs críticos. Definimos juntos el alcance del proyecto para asegurar que Syntra resuelva tus interrogantes de negocio más importantes.",
      icon: Search,
      animation: DiagnosisAnimation
    },
    {
      id: 1,
      title: "Análisis de Arquitectura",
      description: "Nuestro equipo de ingeniería evalúa tu ecosistema tecnológico actual. Mapeamos tus fuentes de datos, sistemas ERP y almacenes existentes para diseñar una estrategia de integración eficiente y una gobernanza de datos sólida.",
      icon: FileText,
      animation: ArchitectureAnimation
    },
    {
      id: 2,
      title: "Migración e Infraestructura Segura",
      description: "Centralizamos tu información en un entorno Databricks optimizado. Construimos una arquitectura de datos robusta, garantizando la encriptación de extremo a extremo y el cumplimiento de los estándares de seguridad más estrictos.",
      icon: Database,
      animation: MigrationAnimation
    },
    {
      id: 3,
      title: "Configuración Semántica",
      description: "Adaptamos la Inteligencia Artificial a tu realidad. Configuramos las reglas de negocio y metadatos específicos de tu industria para que Syntra entienda tu terminología y entregue respuestas precisas sin errores de contexto.",
      icon: Settings,
      animation: ConfigurationAnimation
    },
    {
      id: 4,
      title: "Despliegue y Acompañamiento",
      description: "Habilitamos el acceso vía SSO y capacitamos a tu equipo para garantizar una adopción exitosa. Mantenemos un soporte continuo para asegurar que la plataforma evolucione junto con tu empresa.",
      icon: Rocket,
      animation: DeploymentAnimation
    }
  ];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const sectionTop = rect.top;
      const sectionBottom = rect.bottom;
      
      // Check if section is in viewport
      const isInView = sectionTop <= viewportHeight && sectionBottom >= 0;
      
      if (!isInView) {
        if (isSectionActive) {
          setIsSectionActive(false);
        }
        return;
      }

      if (!isSectionActive) {
        setIsSectionActive(true);
      }

      // Calculate scroll progress within the section
      // When section top is at viewport top (sectionTop = 0), progress = 0
      // When section bottom is at viewport top (sectionTop = -(sectionHeight - viewportHeight)), progress = 1
      const sectionHeight = section.offsetHeight;
      
      // Increase scrollable area significantly - give each step 2.5 viewport heights
      // This ensures plenty of scroll space, especially for the last step
      const minScrollableHeight = viewportHeight * steps.length * 2.5;
      const scrollableHeight = Math.max(sectionHeight - viewportHeight, minScrollableHeight);
      
      // Calculate progress: when sectionTop is 0 (section just entered viewport), progress = 0
      // When sectionTop is -scrollableHeight (section bottom at viewport top), progress = 1
      const rawProgress = -sectionTop / scrollableHeight;
      const scrollProgress = Math.max(0, Math.min(1, rawProgress));
      scrollProgressRef.current = scrollProgress;

      // Convert progress to step index with non-linear distribution
      // Give the last step much more scroll space (50% of total scroll area!)
      // First 4 steps: 0-0.5 of progress, Last step: 0.5-1.0 of progress
      let stepIndex;
      if (scrollProgress < 0.5) {
        // First 4 steps share the first 50% of scroll progress
        stepIndex = Math.min(
          steps.length - 2,
          Math.floor((scrollProgress / 0.5) * (steps.length - 1))
        );
      } else {
        // Last step gets the remaining 50% of scroll progress (huge space!)
        stepIndex = steps.length - 1;
      }
      
      // Ensure we stay at the last step when we reach 45% progress or more
      // This makes the last step activate earlier and stay much longer
      const finalStepIndex = scrollProgress >= 0.45 
        ? steps.length - 1 
        : stepIndex;
      
      if (finalStepIndex !== activeStep) {
        setActiveStep(finalStepIndex);
      }
    };

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", throttledScroll);
    };
  }, [isSectionActive, activeStep, steps.length]);

  const activeStepData = steps[activeStep];

  return (
    <section 
      ref={sectionRef}
      className="border-t border-black/5 bg-gradient-to-b from-base to-white px-8 py-32 md:px-16 md:py-40"
      style={{ minHeight: `${Math.max(steps.length * 200, 1000)}vh` }}
    >
      <div className="sticky top-0 mx-auto max-w-6xl py-20">
        <div className="mb-20 text-center">
          <h2 className="text-3xl font-bold text-base-foreground md:text-4xl lg:text-5xl">
            Implementación a la medida
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Acompañamiento experto desde el primer contacto hasta el despliegue final.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          {/* Left Column - Steps */}
          <div className="relative">
            {/* Vertical Line Background */}
            <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/10 via-primary/20 to-primary/10" />
            
            {/* Progress Line */}
            <div
              className="absolute left-7 top-0 w-0.5 bg-gradient-to-b from-primary/30 to-primary transition-all duration-500"
              style={{
                height: `${((activeStep + 1) / steps.length) * 100}%`
              }}
            />

            <div className="space-y-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === index;
                
                return (
                  <div
                    key={step.id}
                    className="relative flex flex-col gap-2 transition-all group py-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon Circle */}
                      <div className="relative z-10 flex shrink-0 items-center justify-center">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isActive
                              ? "border-primary bg-primary/20 shadow-md scale-105"
                              : "border-primary/30 bg-primary/5 group-hover:border-primary/50"
                          }`}
                        >
                          <Icon
                            className={`h-6 w-6 transition-colors duration-300 ${
                              isActive ? "text-primary" : "text-primary/60"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Step Title */}
                      <div className="flex-1">
                        <h3
                          className={`text-base font-semibold transition-colors duration-300 md:text-lg ${
                            isActive ? "text-primary" : "text-base-foreground/60 group-hover:text-base-foreground/80"
                          }`}
                        >
                          {step.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Animated Visual Content */}
          <div className="flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full space-y-6"
              >
                {/* Animation Container */}
                <div className="overflow-hidden rounded-2xl">
                  {activeStepData && (() => {
                    const AnimationComponent = activeStepData.animation;
                    return <AnimationComponent isActive={isSectionActive && activeStep === activeStepData.id} />;
                  })()}
                </div>

                {/* Content Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="rounded-[28px] border border-black/10 bg-white p-6 md:p-8 shadow-lg"
                  style={{ color: "#000000" }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {activeStepData && (() => {
                        const IconComponent = activeStepData.icon;
                        return <IconComponent className="h-5 w-5" />;
                      })()}
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Paso {activeStep + 1}
                    </span>
                  </div>
                  <h3 
                    className="mb-3 text-xl font-bold md:text-2xl"
                    style={{ color: "#000000" }}
                  >
                    {activeStepData?.title}
                  </h3>
                  <p 
                    className="text-sm font-medium leading-relaxed md:text-base"
                    style={{ color: "#000000" }}
                  >
                    {activeStepData?.description}
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/syntra/demo">
            <Button
              size="lg"
              className="h-14 rounded-full bg-primary px-8 text-base font-semibold text-white shadow-[0_8px_24px_rgba(255,159,50,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(255,159,50,0.4)] hover:bg-primary/90"
            >
              Probar Demo
            </Button>
          </Link>
          <Link href="/#contact">
            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-black/10 px-8 text-base font-semibold"
            >
              Contáctanos ahora
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Additional scroll spacer to give more scroll area for the last step */}
      <div className="h-[200vh]" aria-hidden="true" />
    </section>
  );
};

export default function SyntraLandingPage() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col" style={{ background: "linear-gradient(135deg, #e8eaf6 0%, #f5f5f5 50%, #e3f2fd 100%)", backgroundAttachment: "scroll", transform: "translateZ(0)", willChange: "scroll-position" }}>
      {/* Header */}
      <header className="flex w-full items-center justify-between px-8 py-6 md:px-16">
        <div className="flex items-end gap-3">
          <img 
            src="/assets/icons/Syntra hor no bg lightmode.svg" 
            alt="Syntra" 
            className="h-10 w-auto"
          />
          <div className="mb-0.5 flex items-center gap-1.5">
            <span className="text-[9px] font-medium text-muted-foreground">powered by</span>
            <img 
              src="/assets/icons/databricks1.svg" 
              alt="Databricks" 
              className="h-2.5 w-auto"
            />
          </div>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm" className="rounded-full border-black/10">
            Volver
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-8 py-20 text-center md:px-16">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Headline */}
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-base-foreground md:text-6xl lg:text-7xl">
            Inteligencia de Negocios Conversacional.
            <br />
            <span className="bg-gradient-to-r from-primary via-[#FF9E62] to-[#AA2801] bg-clip-text text-transparent">
              Sin SQL. Sin Barreras.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Convierte preguntas en lenguaje natural en insights estratégicos al instante. 
            Deja de depender de reportes estáticos y empieza a dialogar con tus datos.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Link href="/syntra/demo">
                <Button 
                  size="lg" 
                  className="group h-14 rounded-full bg-primary px-8 text-base font-semibold text-white shadow-[0_8px_24px_rgba(255,159,50,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(255,159,50,0.4)] hover:bg-primary/90"
                >
                  Probar Demo
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/#contact">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-14 rounded-full border-black/10 px-8 text-base font-semibold"
                >
                  Contáctanos
                </Button>
              </Link>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              Powered by Azure OpenAI & Databricks
            </p>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section - Animated Chat */}
      <section className="border-t border-black/5 px-8 py-20 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-base-foreground md:text-4xl lg:text-5xl">
              Simplemente pregunta. Syntra responde.
            </h2>
          </div>

          {/* Animated Chat Demo */}
          <ChatDemo />
        </div>
      </section>

      {/* Problema vs Solución Section */}
      <section className="border-t border-black/5 bg-gradient-to-b from-white to-base px-8 py-20 md:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-base-foreground md:text-4xl lg:text-5xl">
            Democratiza el acceso a los datos de tu empresa
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
            Syntra elimina la brecha técnica entre tu equipo y la información. Ya no necesitas analistas para consultas básicas ni conocimientos de bases de datos. Si sabes preguntar, sabes usar Syntra.
          </p>
        </div>
      </section>

      {/* Sección Técnica y Seguridad - Visual Design */}
      <section className="border-t border-black/5 bg-gradient-to-b from-white via-base to-white px-8 pt-16 pb-24 md:px-16 md:pt-20 md:pb-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20 text-center"
          >
            <h2 className="text-4xl font-bold text-base-foreground md:text-5xl lg:text-6xl">
              Arquitectura Enterprise-Grade
            </h2>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Diseñado para escalar con seguridad robusta y tecnología de punta
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Seguridad Primero */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group relative overflow-hidden rounded-3xl bg-white shadow-xl transition-all hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-8">
                <div className="mb-6">
                  <SecurityFeature />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Shield className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-black">
                      Seguridad Primero
                    </h3>
                  </div>
                  <p className="text-base leading-relaxed text-black/80">
                    Autenticación SSO, control de acceso basado en roles (RBAC) y encriptación de datos.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Stack Moderno */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group relative overflow-hidden rounded-3xl bg-white shadow-xl transition-all hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-8">
                <div className="mb-6">
                  <StackFeature />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Server className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-black">
                      Stack Moderno
                    </h3>
                  </div>
                  <p className="text-base leading-relaxed text-black/80">
                    Construido sobre Next.js, Azure OpenAI (GPT-4) y Delta Lake.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Aislamiento */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="group relative overflow-hidden rounded-3xl bg-white shadow-xl transition-all hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-8">
                <div className="mb-6">
                  <IsolationFeature />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-black">
                      Aislamiento
                    </h3>
                  </div>
                  <p className="text-base leading-relaxed text-black/80">
                    Arquitectura multi-tenant que garantiza la privacidad de tus datos.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Velocidad */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="group relative overflow-hidden rounded-3xl bg-white shadow-xl transition-all hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-8">
                <div className="mb-6">
                  <SpeedFeature />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Gauge className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-black">
                      Velocidad
                    </h3>
                  </div>
                  <p className="text-base leading-relaxed text-black/80">
                    Procesamiento en Apache Spark para respuestas en tiempo real.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
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
              Casos de uso
            </h2>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Nuestras herramientas están diseñadas con flexibilidad y versatilidad en su núcleo, adaptándose a tus roles, industrias y necesidades únicas.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Retail y Puntos de Venta",
                description: "Optimiza tu negocio minorista con insights basados en datos",
                route: "/syntra/retail",
                icon: Store,
                bgColor: "from-blue-50 to-blue-100/50",
                iconColor: "text-blue-600",
              },
              {
                title: "Manufactura",
                description: "Transforma los datos de manufactura en mejores resultados para operaciones y cadenas de suministro",
                route: "/syntra/manufactura",
                icon: Factory,
                bgColor: "from-slate-50 to-slate-100/50",
                iconColor: "text-slate-600",
              },
              {
                title: "Hospitales y Clínicas",
                description: "Mejora los resultados de los pacientes con análisis poderosos de salud",
                route: "/syntra/hospitales",
                icon: Hospital,
                bgColor: "from-rose-50 to-rose-100/50",
                iconColor: "text-rose-600",
              },
              {
                title: "Auditoría y Control Interno",
                description: "Potencia tu institución con insights basados en datos",
                route: "/syntra/auditoria",
                icon: ClipboardCheck,
                bgColor: "from-emerald-50 to-emerald-100/50",
                iconColor: "text-emerald-600",
              },
              {
                title: "Logística",
                description: "Optimiza tus operaciones logísticas con inteligencia de datos",
                route: "/syntra/logistica",
                icon: Truck,
                bgColor: "from-orange-50 to-orange-100/50",
                iconColor: "text-orange-600",
              },
              {
                title: "Dirección General / C-Level",
                description: "Toma decisiones estratégicas basadas en datos en tiempo real",
                route: "/syntra/direccion-general",
                icon: Briefcase,
                bgColor: "from-purple-50 to-purple-100/50",
                iconColor: "text-purple-600",
              },
              {
                title: "Recursos Humanos",
                description: "Transforma los datos de RRHH en mejores resultados para talento y cultura",
                route: "/syntra/recursos-humanos",
                icon: Users,
                bgColor: "from-indigo-50 to-indigo-100/50",
                iconColor: "text-indigo-600",
              },
              {
                title: "Ventas y Marketing",
                description: "Transforma los datos de audiencia en mejores resultados para contenido y engagement",
                route: "/syntra/marketing",
                icon: TrendingUp,
                bgColor: "from-pink-50 to-pink-100/50",
                iconColor: "text-pink-600",
              },
            ].map((useCase, index) => {
              const IconComponent = useCase.icon;
              return (
                <motion.div
                  key={useCase.route}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link href={useCase.route}>
                    <div className="group relative h-full overflow-hidden rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02]">
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${useCase.bgColor} opacity-0 transition-opacity group-hover:opacity-100`} />
                      
                      {/* Content */}
                      <div className="relative">
                        {/* Icon */}
                        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${useCase.bgColor} transition-all group-hover:scale-110 group-hover:shadow-md`}>
                          <IconComponent className={`h-6 w-6 ${useCase.iconColor} transition-transform group-hover:scale-110`} />
                        </div>

                        {/* Title */}
                        <h3 className="mb-2 text-lg font-bold text-base-foreground transition-colors group-hover:text-primary">
                          {useCase.title}
                        </h3>

                        {/* Description */}
                        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                          {useCase.description}
                        </p>

                        {/* Link */}
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          <span>Explorar caso de uso</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Implementación a la Medida Section - Interactive Scroll */}
      <ImplementationSection />

      {/* CTA Final Section */}
      <section className="border-t border-black/5 px-8 py-20 md:px-16">
        <div className="liquid-glass-gradient ambient-glow mx-auto max-w-4xl rounded-[40px] border border-white/40 p-12 text-center md:p-16" style={{ transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}>
          <h2 className="text-3xl font-bold text-base-foreground md:text-4xl lg:text-5xl">
            ¿Listo para transformar la toma de decisiones en tu empresa?
          </h2>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/syntra/demo">
              <Button 
                size="lg" 
                className="group h-14 rounded-full bg-primary px-8 text-base font-semibold text-white shadow-[0_8px_24px_rgba(255,159,50,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(255,159,50,0.4)] hover:bg-primary/90"
              >
                Probar Demo
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/#contact">
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 rounded-full border-black/10 px-8 text-base font-semibold"
              >
                Contáctanos
              </Button>
            </Link>
          </div>
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

