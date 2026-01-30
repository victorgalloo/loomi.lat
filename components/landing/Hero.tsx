"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { Language } from "@/types/landing";
import { getTranslations } from "@/lib/translations";
import { trustedLogos } from "@/data/landing";
import { Container, Button } from "./shared";
import { animations } from "@/lib/constants";

interface HeroProps {
  language: Language;
}

/**
 * Hero section with headline, description, and CTAs
 */
export default function Hero({ language }: HeroProps) {
  const t = getTranslations("hero", language);

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden pt-24 bg-gray-50">
      {/* Background Elements */}
      <HeroBackground />

      {/* Content */}
      <Container className="relative z-10 w-full">
        <div className="max-w-2xl text-left">
          {/* Headline */}
          <motion.h1
            {...animations.fadeInUpDelayed(0.1)}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5"
          >
            <span className="text-gray-900">{t.headline1}</span>
            <br />
            <span className="bg-gradient-to-r from-[#FF3621] to-[#FF6B35] bg-clip-text text-transparent">
              {t.headline2}
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            {...animations.fadeInUpDelayed(0.2)}
            className="max-w-xl text-base lg:text-lg text-gray-600 mb-8 leading-relaxed"
          >
            {t.description}
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...animations.fadeInUpDelayed(0.3)}
            className="flex flex-col sm:flex-row items-start gap-3"
          >
            <Button href="#contact-form" showArrow>
              {t.cta1}
            </Button>
            <Button href="#projects" variant="secondary">
              {t.cta2}
            </Button>
          </motion.div>

          {/* Trusted Logos */}
          <motion.div
            initial={animations.fadeIn.initial}
            animate={animations.fadeIn.animate}
            transition={{ ...animations.fadeIn.transition, delay: 0.5 }}
            className="mt-16"
          >
            <p className="text-sm text-gray-500 mb-4">{t.trusted}</p>
            <div className="flex items-center gap-8 lg:gap-10">
              {trustedLogos.map((logo) => (
                <div 
                  key={logo.name}
                  className="flex items-center gap-2.5 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <Image 
                    src={logo.src} 
                    alt={logo.name} 
                    width={24} 
                    height={24} 
                  />
                  <span className="text-sm font-medium text-gray-600">
                    {logo.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

/**
 * Hero background decorative elements
 */
function HeroBackground() {
  return (
    <>
      {/* Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 54, 33, 0.08), transparent 60%)`
        }}
      />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating Orbs */}
      <motion.div
        animate={{ y: [0, -30, 0], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#FF3621]/10 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 30, 0], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#FF6B35]/10 blur-3xl"
      />
    </>
  );
}
