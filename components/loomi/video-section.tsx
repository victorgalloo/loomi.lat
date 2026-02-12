'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, AlertTriangle, CheckCircle, Clock, DollarSign, Users, TrendingDown, TrendingUp, Zap, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button-loomi';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

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

  const leadsLostPerDay = Math.round(mensajes * 0.3);
  const potentialSalesLost = Math.round(leadsLostPerDay * 0.2);
  const moneyLostDaily = potentialSalesLost * ticket;
  const moneyLostMonthly = moneyLostDaily * 22;

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-terminal-red/10 flex items-center justify-center">
          <TrendingDown className="w-6 h-6 text-terminal-red" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">Calcula tu pérdida</h3>
      </div>

      <div className="space-y-8 font-mono">
        <div>
          <label className="text-muted mb-3 block">mensajes_por_día</label>
          <input
            type="range"
            min="10"
            max="500"
            value={mensajes}
            onChange={(e) => setMensajes(Number(e.target.value))}
            className="w-full accent-foreground h-2"
          />
          <div className="flex justify-between text-sm mt-2">
            <span className="text-muted">10</span>
            <span className="text-2xl font-bold text-foreground">{mensajes}</span>
            <span className="text-muted">500</span>
          </div>
        </div>

        <div>
          <label className="text-muted mb-3 block">ticket_promedio_usd</label>
          <input
            type="range"
            min="50"
            max="5000"
            step="50"
            value={ticket}
            onChange={(e) => setTicket(Number(e.target.value))}
            className="w-full accent-foreground h-2"
          />
          <div className="flex justify-between text-sm mt-2">
            <span className="text-muted">$50</span>
            <span className="text-2xl font-bold text-foreground">${ticket.toLocaleString()}</span>
            <span className="text-muted">$5,000</span>
          </div>
        </div>

        <motion.button
          onClick={() => setShowResult(true)}
          className="w-full py-4 bg-terminal-red/10 hover:bg-terminal-red/20 text-terminal-red rounded-2xl text-lg font-bold transition-colors border border-terminal-red/20"
          whileTap={{ scale: 0.98 }}
        >
          $ calcular
        </motion.button>

        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 border-t border-border space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted">leads_sin_respuesta</span>
                  <span className="text-xl font-bold text-foreground">{leadsLostPerDay}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">ventas_perdidas_día</span>
                  <span className="text-xl font-bold text-foreground">{potentialSalesLost}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-muted font-bold">pérdida_mensual</span>
                  <span className="text-4xl font-black text-terminal-red">
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
    <div className="p-8 lg:p-10 h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-foreground">Tu WhatsApp</h3>
        <div className="flex items-center gap-1 p-1 bg-surface rounded-2xl">
          <button
            onClick={() => setIsAfter(false)}
            className={`px-4 py-2 text-sm font-mono rounded-xl transition-colors ${
              !isAfter ? 'bg-terminal-red/20 text-terminal-red' : 'text-muted'
            }`}
          >
            sin_loomi
          </button>
          <button
            onClick={() => setIsAfter(true)}
            className={`px-4 py-2 text-sm font-mono rounded-xl transition-colors ${
              isAfter ? 'bg-terminal-green/20 text-terminal-green' : 'text-muted'
            }`}
          >
            con_loomi
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
            className="space-y-4 font-mono"
          >
            <div className="flex items-center gap-4 p-4 bg-terminal-red/5 border border-terminal-red/20 rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-terminal-red flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground">47 mensajes sin leer</p>
                <p className="text-sm text-terminal-red">hace 3 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-terminal-red/5 border border-terminal-red/20 rounded-2xl">
              <Clock className="w-6 h-6 text-terminal-red flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground">"¿Siguen disponibles?"</p>
                <p className="text-sm text-terminal-red">sin respuesta - lead perdido</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-terminal-red/5 border border-terminal-red/20 rounded-2xl">
              <DollarSign className="w-6 h-6 text-terminal-red flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground">"Compré con la competencia"</p>
                <p className="text-sm text-terminal-red">venta perdida: $2,500</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-terminal-red/10 rounded-2xl text-center border border-terminal-red/20">
              <p className="text-terminal-red font-bold text-lg">status: stress</p>
              <p className="text-muted mt-1">// siempre atrasado</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="after"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 font-mono"
          >
            <div className="flex items-center gap-4 p-4 bg-terminal-green/5 border border-terminal-green/20 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-terminal-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground">todos respondidos</p>
                <p className="text-sm text-terminal-green">avg: 0.8s</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-terminal-green/5 border border-terminal-green/20 rounded-2xl">
              <Users className="w-6 h-6 text-terminal-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground">12 demos agendadas</p>
                <p className="text-sm text-terminal-green">esta semana</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-terminal-green/5 border border-terminal-green/20 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-terminal-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground">+340% conversiones</p>
                <p className="text-sm text-terminal-green">vs. mes anterior</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-terminal-green/10 rounded-2xl text-center border border-terminal-green/20">
              <p className="text-terminal-green font-bold text-lg">status: relax</p>
              <p className="text-muted mt-1">// loomi trabaja 24/7</p>
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
      className="text-center mb-20"
    >
      <div className="inline-flex items-center gap-3 px-5 py-3 bg-terminal-red/10 border border-terminal-red/20 rounded-full mb-8 font-mono">
        <motion.div
          className="w-3 h-3 rounded-full bg-terminal-red"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-terminal-red font-bold">LIVE</span>
      </div>
      <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-foreground mb-6">
        <span className="text-terminal-red">{lostLeads.toLocaleString()}</span> leads
      </h2>
      <p className="text-2xl lg:text-3xl text-muted mb-4">
        perdidos hoy por respuestas tardías
      </p>
      <p className="text-lg text-muted">
        <span className="text-terminal-red">+{lostToday}</span> en la última hora
      </p>
    </motion.div>
  );
}

function SlotCounter() {
  const totalSlots = 10;
  const [takenSlots, setTakenSlots] = useState(7);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (takenSlots < 9 && Math.random() > 0.7) {
        setTakenSlots((prev) => prev + 1);
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [takenSlots]);

  const remainingSlots = totalSlots - takenSlots;

  return (
    <div className="p-8 lg:p-10 text-center font-mono">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Zap className="w-6 h-6 text-terminal-yellow" />
        <span className="text-xl font-bold text-terminal-yellow">esta semana</span>
      </div>

      <div className="flex justify-center gap-3 mb-8">
        {Array.from({ length: totalSlots }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center ${
              i < takenSlots
                ? 'bg-foreground/20 border-foreground'
                : 'border-border'
            }`}
            initial={false}
            animate={i < takenSlots ? { scale: [1, 1.2, 1] } : {}}
          >
            {i < takenSlots && (
              <CheckCircle className="w-5 h-5 text-foreground" />
            )}
          </motion.div>
        ))}
      </div>

      <p className="text-foreground mb-2">
        <span className="text-5xl font-black">{remainingSlots}</span>
        <span className="text-muted text-xl"> de {totalSlots} slots</span>
      </p>
      <p className="text-muted mb-10">
        // configuración personalizada incluida
      </p>

      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="block">
        <Button variant="primary" size="lg" className="w-full text-lg py-6">
          <MessageCircle className="w-5 h-5 mr-2" />
          Reservar slot
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </a>

      <p className="text-sm text-muted mt-6">
        setup 48hrs · soporte dedicado · sin compromiso
      </p>
    </div>
  );
}

export function VideoSection() {
  return (
    <section className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background">
      <div className="relative max-w-7xl mx-auto">
        <LiveStats />

        {/* Cinematic grid with subtle separators */}
        <div className="grid lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden">
          <div className="bg-background">
            <Calculator />
          </div>
          <div className="bg-background">
            <BeforeAfter />
          </div>
          <div className="bg-background">
            <SlotCounter />
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted text-lg mt-16"
        >
          // el 78% de los leads compran al primero que responde
        </motion.p>
      </div>
    </section>
  );
}
