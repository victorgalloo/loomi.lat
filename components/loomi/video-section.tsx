'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, AlertTriangle, CheckCircle, Clock, DollarSign, Users, TrendingDown, TrendingUp, Zap, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button-loomi';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

// Simulated real-time counter
function useAnimatedCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnView);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (startOnView && isInView) {
      setHasStarted(true);
    }
  }, [isInView, startOnView]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  return { count, ref };
}

// Live counter that increments
function useLiveCounter(baseValue: number, incrementPerSecond: number) {
  const [value, setValue] = useState(baseValue);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 1000 / incrementPerSecond);
    return () => clearInterval(interval);
  }, [incrementPerSecond]);

  return value;
}

function Calculator() {
  const [mensajes, setMensajes] = useState(50);
  const [ticket, setTicket] = useState(500);
  const [showResult, setShowResult] = useState(false);

  // Assuming 30% of unanswered leads are lost, 20% would convert
  const leadsLostPerDay = Math.round(mensajes * 0.3);
  const potentialSalesLost = Math.round(leadsLostPerDay * 0.2);
  const moneyLostDaily = potentialSalesLost * ticket;
  const moneyLostMonthly = moneyLostDaily * 22; // business days

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
          <TrendingDown className="w-4 h-4 text-red-500" />
        </div>
        <h3 className="text-foreground font-semibold">Calcula tu pérdida</h3>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-muted mb-2 block">Mensajes por día</label>
          <input
            type="range"
            min="10"
            max="500"
            value={mensajes}
            onChange={(e) => setMensajes(Number(e.target.value))}
            className="w-full accent-neon-green"
          />
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted">10</span>
            <span className="text-foreground font-medium">{mensajes}</span>
            <span className="text-muted">500</span>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted mb-2 block">Ticket promedio (USD)</label>
          <input
            type="range"
            min="50"
            max="5000"
            step="50"
            value={ticket}
            onChange={(e) => setTicket(Number(e.target.value))}
            className="w-full accent-neon-green"
          />
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted">$50</span>
            <span className="text-foreground font-medium">${ticket.toLocaleString()}</span>
            <span className="text-muted">$5,000</span>
          </div>
        </div>

        <motion.button
          onClick={() => setShowResult(true)}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-medium transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          Calcular pérdida
        </motion.button>

        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Leads que no respondes/día</span>
                  <span className="text-foreground font-medium">{leadsLostPerDay}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Ventas perdidas/día</span>
                  <span className="text-foreground font-medium">{potentialSalesLost}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-muted font-medium">Pérdida mensual</span>
                  <span className="text-2xl font-bold text-red-500">
                    ${moneyLostMonthly.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BeforeAfter() {
  const [isAfter, setIsAfter] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-foreground font-semibold">Tu WhatsApp</h3>
        <div className="flex items-center gap-2 p-1 bg-background rounded-full">
          <button
            onClick={() => setIsAfter(false)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              !isAfter ? 'bg-red-500/20 text-red-500' : 'text-muted'
            }`}
          >
            Sin Loomi
          </button>
          <button
            onClick={() => setIsAfter(true)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              isAfter ? 'bg-neon-green/20 text-neon-green' : 'text-muted'
            }`}
          >
            Con Loomi
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isAfter ? (
          <motion.div
            key="before"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {/* Chaos state */}
            <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">47 mensajes sin leer</p>
                <p className="text-xs text-red-500">Hace 3 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
              <Clock className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">"¿Siguen disponibles?"</p>
                <p className="text-xs text-red-500">Sin respuesta - Lead perdido</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
              <DollarSign className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">"Compré con la competencia"</p>
                <p className="text-xs text-red-500">Venta perdida: $2,500</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-red-500/10 rounded-xl text-center">
              <p className="text-red-500 font-medium">Estrés constante</p>
              <p className="text-xs text-muted mt-1">Siempre atrasado, siempre perdiendo</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="after"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {/* Peace state */}
            <div className="flex items-center gap-3 p-3 bg-neon-green/5 border border-neon-green/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">Todos respondidos</p>
                <p className="text-xs text-neon-green">Tiempo promedio: 0.8s</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neon-green/5 border border-neon-green/20 rounded-xl">
              <Users className="w-5 h-5 text-neon-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">12 demos agendadas</p>
                <p className="text-xs text-neon-green">Esta semana</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neon-green/5 border border-neon-green/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-neon-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">+340% conversiones</p>
                <p className="text-xs text-neon-green">vs. mes anterior</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-neon-green/10 rounded-xl text-center">
              <p className="text-neon-green font-medium">Cero estrés</p>
              <p className="text-xs text-muted mt-1">Loomi trabaja 24/7 por ti</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LiveStats() {
  const lostLeads = useLiveCounter(12847, 2);
  const { count: lostToday, ref } = useAnimatedCounter(847, 1500);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-12"
    >
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
        <motion.div
          className="w-2 h-2 rounded-full bg-red-500"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-sm text-red-500 font-medium">En vivo</span>
      </div>
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
        <span className="text-red-500">{lostLeads.toLocaleString()}</span> leads
      </h2>
      <p className="text-xl text-muted mb-2">
        perdidos hoy por respuestas tardías
      </p>
      <p className="text-sm text-muted">
        <span className="text-red-500">+{lostToday}</span> en la última hora
      </p>
    </motion.div>
  );
}

function SlotCounter() {
  const totalSlots = 10;
  const [takenSlots, setTakenSlots] = useState(7);

  useEffect(() => {
    // Occasionally increment to create urgency
    const timeout = setTimeout(() => {
      if (takenSlots < 9 && Math.random() > 0.7) {
        setTakenSlots((prev) => prev + 1);
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [takenSlots]);

  const remainingSlots = totalSlots - takenSlots;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-surface border border-neon-green/30 rounded-2xl p-6 text-center"
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-neon-yellow" />
        <span className="text-sm font-medium text-neon-yellow">Onboarding esta semana</span>
      </div>

      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: totalSlots }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-6 h-6 rounded-full border-2 ${
              i < takenSlots
                ? 'bg-neon-green/20 border-neon-green'
                : 'border-border'
            }`}
            initial={false}
            animate={i < takenSlots ? { scale: [1, 1.2, 1] } : {}}
          >
            {i < takenSlots && (
              <CheckCircle className="w-full h-full text-neon-green p-0.5" />
            )}
          </motion.div>
        ))}
      </div>

      <p className="text-foreground mb-1">
        <span className="text-2xl font-bold text-neon-green">{remainingSlots}</span>
        <span className="text-muted"> de {totalSlots} slots disponibles</span>
      </p>
      <p className="text-sm text-muted mb-6">
        Configuración personalizada incluida
      </p>

      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="block">
        <Button variant="primary" size="lg" glow className="w-full group">
          <MessageCircle className="w-4 h-4 mr-2" />
          Reservar mi slot
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </a>

      <p className="text-xs text-muted mt-4">
        Setup en 48hrs · Soporte dedicado · Sin compromiso
      </p>
    </motion.div>
  );
}

export function VideoSection() {
  return (
    <section className="py-28 sm:py-40 px-4 sm:px-6 relative overflow-hidden bg-background transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-red-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-neon-green/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Live Stats Header */}
        <LiveStats />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Calculator */}
          <div className="lg:col-span-1">
            <Calculator />
          </div>

          {/* Before/After */}
          <div className="lg:col-span-1">
            <BeforeAfter />
          </div>

          {/* Slot Counter CTA */}
          <div className="lg:col-span-1">
            <SlotCounter />
          </div>
        </div>

        {/* Bottom urgency message */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted text-sm"
        >
          El 78% de los leads compran al primero que responde. ¿Vas a seguir siendo el segundo?
        </motion.p>
      </div>
    </section>
  );
}
