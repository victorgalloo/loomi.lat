"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { selectedWorkAnimations } from "@/lib/selected-work-animations";
import type { Language } from "@/types/landing";
import { getTranslations } from "@/lib/translations";

interface HeroSectionProps {
  language: Language;
}

/**
 * Hero section with animated title and scroll indicator
 */
export function HeroSection({ language }: HeroSectionProps) {
  const t = getTranslations("selectedWork", language);

  return (
    <section className="h-screen flex flex-col items-center justify-center relative overflow-hidden snap-start snap-always">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF3621]/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#FF6B35]/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl">
        {/* Brand */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-lg md:text-xl font-medium text-[#FF3621] mb-4"
        >
          anthana.agency
        </motion.p>

        {/* Main Title */}
        <motion.h1
          initial={selectedWorkAnimations.heroTitle.initial}
          animate={selectedWorkAnimations.heroTitle.animate}
          className="text-6xl md:text-8xl lg:text-9xl font-bold text-gray-900 tracking-tight"
        >
          {t.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={selectedWorkAnimations.heroSubtitle.initial}
          animate={selectedWorkAnimations.heroSubtitle.animate}
          className="mt-6 text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto"
        >
          {t.subtitle}
        </motion.p>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-sm text-gray-500 font-medium">
          {t.scrollToExplore}
        </span>
        <motion.div
          animate={selectedWorkAnimations.scrollIndicator.animate}
        >
          <ChevronDown className="w-6 h-6 text-[#FF3621]" />
        </motion.div>
      </motion.div>
    </section>
  );
}
