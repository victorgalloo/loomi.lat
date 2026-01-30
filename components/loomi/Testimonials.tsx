'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: 'Antes perdíamos el 40% de los leads porque tardábamos en responder. Ahora agendamos 3x más demos sin contratar a nadie.',
    name: 'María González',
    role: 'CEO',
    company: 'ModaLab MX',
    metric: '+340%',
    metricLabel: 'demos agendadas',
  },
  {
    quote: 'Mis vendedores ya no pierden tiempo calificando. Loomi les pasa solo leads que están listos para comprar.',
    name: 'Carlos Ruiz',
    role: 'Director Comercial',
    company: 'TechConsulting',
    metric: '85%',
    metricLabel: 'leads calificados',
  },
  {
    quote: 'Pasamos del 35% de no-shows al 8%. El lead llega a la demo sabiendo exactamente qué esperar.',
    name: 'Ana Martínez',
    role: 'Head of Growth',
    company: 'ClinicaDent',
    metric: '-78%',
    metricLabel: 'no-shows',
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const next = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <section className="py-28 sm:py-40 px-4 sm:px-6 relative overflow-hidden bg-background transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-border to-transparent" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Equipos que ya usan Loomi.
          </h2>
          <p className="text-xl text-muted">
            Resultados reales de empresas en México y LATAM
          </p>
        </motion.div>

        {/* Testimonial carousel */}
        <div className="relative min-h-[400px] flex items-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              {/* Metric */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <span
                  className="text-7xl sm:text-8xl lg:text-9xl font-bold text-neon-green"
                  style={{ textShadow: '0 0 60px rgba(0,255,102,0.3)' }}
                >
                  {TESTIMONIALS[current].metric}
                </span>
                <p className="text-muted text-lg mt-2">{TESTIMONIALS[current].metricLabel}</p>
              </motion.div>

              {/* Quote */}
              <motion.blockquote
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-3xl lg:text-4xl text-foreground font-medium leading-relaxed max-w-3xl mb-10"
              >
                "{TESTIMONIALS[current].quote}"
              </motion.blockquote>

              {/* Author */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-foreground font-medium text-lg">{TESTIMONIALS[current].name}</p>
                <p className="text-muted">
                  {TESTIMONIALS[current].role}, {TESTIMONIALS[current].company}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-muted hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-3 mt-10">
          {TESTIMONIALS.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > current ? 1 : -1);
                setCurrent(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === current
                  ? 'bg-neon-green w-8'
                  : 'bg-border hover:bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
