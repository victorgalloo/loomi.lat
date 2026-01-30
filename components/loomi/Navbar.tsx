'use client';

import { Button } from '@/components/ui/button-loomi';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { MessageCircle, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WHATSAPP_LINK = 'https://api.whatsapp.com/send?phone=529849800629&text=Hola%20Loomi%20quiero%20una%20demo';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'Proceso' },
  { href: '#pricing', label: 'Precios' },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/90 backdrop-blur-xl border-b border-border'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="w-8 h-8 rounded-lg bg-neon-green flex items-center justify-center"
            >
              <span className="text-gray-900 font-bold text-lg">L</span>
            </motion.div>
            <span className="font-semibold text-lg text-foreground">Loomi</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <motion.div key={link.href} whileHover={{ y: -2 }}>
                <Link
                  href={link.href}
                  className="text-muted hover:text-foreground transition-colors text-sm font-medium link-underline"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="sm" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Agendar Demo
              </Button>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2 text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface border-t border-border"
          >
            <div className="px-4 py-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-muted hover:text-foreground text-base py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-border">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="primary" size="md" className="w-full gap-2" glow>
                    <MessageCircle className="w-4 h-4" />
                    Agendar Demo
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
