'use client';

import { Button } from '@/components/ui/button-loomi';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

export function CTA() {
  return (
    <section className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background">
      <div className="relative max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-foreground mb-8 leading-tight font-mono"
        >
          ¿Cuántos leads
          <br />
          <span className="text-muted">perdiste hoy?</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="lg" className="group text-lg px-10 py-7 w-full sm:w-auto font-mono">
              <MessageCircle className="w-5 h-5 mr-3" />
              ./agendar-demo
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-muted font-mono"
        >
          demo 15 min · sin compromiso
        </motion.p>
      </div>
    </section>
  );
}
