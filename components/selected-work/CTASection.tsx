"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { selectedWorkAnimations } from "@/lib/selected-work-animations";
import { getTranslations } from "@/lib/translations";
import type { Language } from "@/types/landing";

interface CTASectionProps {
  language: Language;
}

/**
 * Call to action section at the end of the portfolio
 */
export function CTASection({ language }: CTASectionProps) {
  const t = getTranslations("selectedWork", language);

  return (
    <section className="min-h-screen flex items-center justify-center snap-start snap-always relative overflow-hidden bg-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FF3621]/20 via-transparent to-transparent" />
        <motion.div
          className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#FF3621]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#FF6B35]/10 rounded-full blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl">
        <motion.h2
          initial={selectedWorkAnimations.ctaSection.initial}
          whileInView={selectedWorkAnimations.ctaSection.animate}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
        >
          {t.ctaTitle}
        </motion.h2>

        <motion.p
          initial={{ ...selectedWorkAnimations.ctaSection.initial, transition: { delay: 0.2 } }}
          whileInView={{ ...selectedWorkAnimations.ctaSection.animate, transition: { delay: 0.2 } }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl text-gray-400 mb-10"
        >
          {t.ctaSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-gray-900 bg-white rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            {t.ctaButton}
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white border-2 border-white/30 rounded-full hover:border-white/60 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.backToHome}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
