'use client';

import { Button } from '@/components/ui/button-loomi';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

export function CTA() {
  return (
    <section className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background transition-colors duration-300">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-green/10 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-8 leading-tight"
        >
          ¿Cuántos leads
          <br />
          <span className="text-neon-green" style={{ textShadow: '0 0 40px rgba(0,255,102,0.4)' }}>
            perdiste hoy
          </span>{' '}
          por no responder?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl sm:text-2xl text-muted mb-12 max-w-2xl mx-auto"
        >
          El 78% de los leads compran al primero que responde. Asegúrate de ser tú.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="lg" glow className="group text-lg px-8 py-6 w-full sm:w-auto">
              <MessageCircle className="w-5 h-5 mr-2" />
              Agendar Demo Gratis
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
              Hablar con Ventas
            </Button>
          </a>
        </motion.div>

        {/* Trust points */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-12 text-sm text-muted"
        >
          <span>✓ Respuesta inmediata</span>
          <span>✓ Demo de 15 minutos</span>
          <span>✓ Soporte en español</span>
        </motion.div>
      </div>
    </section>
  );
}
