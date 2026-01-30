'use client';

import { Linkedin, Instagram, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

type FooterLink = { label: string; href: string; external?: boolean };

const LINKS: Record<string, FooterLink[]> = {
  producto: [
    { label: 'Features', href: '#features' },
    { label: 'Precios', href: '#pricing' },
    { label: 'Demo', href: WHATSAPP_LINK, external: true },
  ],
  empresa: [
    { label: 'Anthana Agency', href: 'https://www.linkedin.com/company/anthanaagency/', external: true },
    { label: 'Contacto', href: WHATSAPP_LINK, external: true },
  ],
  legal: [
    { label: 'Privacidad', href: '#' },
    { label: 'Términos', href: '#' },
  ],
};

const SOCIALS = [
  {
    icon: MessageCircle,
    href: WHATSAPP_LINK,
    label: 'WhatsApp',
    color: 'hover:text-[#25D366]'
  },
  {
    icon: Linkedin,
    href: 'https://www.linkedin.com/company/anthanaagency/',
    label: 'LinkedIn',
    color: 'hover:text-[#0A66C2]'
  },
  {
    icon: Instagram,
    href: 'https://www.instagram.com/anthana.agency/',
    label: 'Instagram',
    color: 'hover:text-[#E4405F]'
  },
];

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-neon-green flex items-center justify-center">
                <span className="text-gray-900 font-bold">L</span>
              </div>
              <span className="font-semibold text-foreground">Loomi</span>
            </Link>
            <p className="text-muted text-sm mb-4">
              El agente de ventas con IA que nunca duerme.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className={`w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center text-muted ${social.color} hover:bg-border transition-colors`}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-foreground font-medium mb-3 capitalize">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-foreground transition-colors text-sm"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-muted hover:text-foreground transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 border border-neon-green/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-foreground font-medium">¿Listo para convertir más leads?</p>
              <p className="text-muted text-sm">Agenda una demo de 15 minutos por WhatsApp</p>
            </div>
            <motion.a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 bg-neon-green text-gray-900 font-medium rounded-xl hover:shadow-lg hover:shadow-neon-green/20 transition-shadow"
            >
              <MessageCircle className="w-5 h-5" />
              Escribir por WhatsApp
            </motion.a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted text-sm">
            © {new Date().getFullYear()} Loomi by{' '}
            <a
              href="https://www.linkedin.com/company/anthanaagency/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-neon-green transition-colors"
            >
              Anthana Agency
            </a>
          </p>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>Hecho con</span>
            <motion.span
              className="text-red-500"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ♥
            </motion.span>
            <span>en México</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
