'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: 'Ahora agendamos 3x más demos sin contratar a nadie.',
    name: 'María González',
    role: 'CEO, ModaLab MX',
    metric: '+340%',
    metricLabel: 'demos',
  },
  {
    quote: 'Loomi les pasa solo leads listos para comprar.',
    name: 'Carlos Ruiz',
    role: 'Director Comercial, TechConsulting',
    metric: '85%',
    metricLabel: 'calificados',
  },
  {
    quote: 'Pasamos del 35% de no-shows al 8%.',
    name: 'Ana Martínez',
    role: 'Head of Growth, ClinicaDent',
    metric: '-78%',
    metricLabel: 'no-shows',
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
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

  return (
    <section className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background">
      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground font-mono">
            Resultados
          </h2>
        </motion.div>

        <div className="relative min-h-[400px] flex items-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ x: direction > 0 ? 100 : -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction < 0 ? 100 : -100, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <span className="text-[100px] sm:text-[140px] lg:text-[180px] font-black text-foreground font-mono leading-none">
                {TESTIMONIALS[current].metric}
              </span>
              <p className="text-muted text-xl font-mono mb-8">
                {TESTIMONIALS[current].metricLabel}
              </p>

              <blockquote className="text-2xl sm:text-3xl lg:text-4xl text-foreground font-medium max-w-3xl mb-8">
                "{TESTIMONIALS[current].quote}"
              </blockquote>

              <p className="text-foreground font-bold">{TESTIMONIALS[current].name}</p>
              <p className="text-muted">{TESTIMONIALS[current].role}</p>
            </motion.div>
          </AnimatePresence>

          <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-muted hover:text-foreground">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-muted hover:text-foreground">
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          {TESTIMONIALS.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > current ? 1 : -1);
                setCurrent(index);
              }}
              className={`h-1 rounded-full transition-all ${index === current ? 'bg-foreground w-12' : 'bg-border w-4'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
