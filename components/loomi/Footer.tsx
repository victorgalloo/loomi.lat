'use client';

import { Linkedin, Instagram, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

const SOCIALS = [
  { icon: MessageCircle, href: WHATSAPP_LINK, label: 'WhatsApp' },
  { icon: Linkedin, href: 'https://www.linkedin.com/company/anthanaagency/', label: 'LinkedIn' },
  { icon: Instagram, href: 'https://www.instagram.com/anthana.agency/', label: 'Instagram' },
];

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-terminal-red" />
                <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
                <div className="w-3 h-3 rounded-full bg-terminal-green" />
              </div>
              <span className="font-mono font-semibold text-foreground">loomi_</span>
            </Link>
            <div className="flex gap-3">
              {SOCIALS.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm font-mono text-muted">
            <Link href="#features" className="hover:text-foreground">features</Link>
            <Link href="#pricing" className="hover:text-foreground">precios</Link>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">demo</a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-sm text-muted">
          <p>
            © {new Date().getFullYear()} loomi by{' '}
            <a href="https://www.linkedin.com/company/anthanaagency/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
              anthana
            </a>
          </p>
          <div className="flex items-center gap-2">
            <span>made with</span>
            <motion.span className="text-terminal-red" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>♥</motion.span>
            <span>in méxico</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
