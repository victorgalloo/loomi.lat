"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { Language } from "@/types/landing";
import { getTranslations } from "@/lib/translations";
import { skills } from "@/data/landing";
import { SectionHeader } from "./shared";
import { animations, viewport } from "@/lib/constants";

interface SkillsProps {
  language: Language;
}

/**
 * Skills/Technologies marquee section
 */
export default function Skills({ language }: SkillsProps) {
  const t = getTranslations("skills", language);
  const doubledSkills = [...skills, ...skills];

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="relative z-10">
        <SectionHeader 
          title={t.title} 
          subtitle={t.subtitle}
          className="px-6"
        />

        {/* First Row - Normal Direction */}
        <div className="marquee-container">
          <motion.div
            initial={animations.fadeIn.initial}
            whileInView={animations.fadeIn.animate}
            viewport={viewport}
            transition={{ ...animations.fadeIn.transition, delay: 0.2 }}
            className="flex animate-marquee"
          >
            {doubledSkills.map((skill, index) => (
              <SkillItem key={`${skill.name}-${index}`} skill={skill} />
            ))}
          </motion.div>
        </div>

        {/* Second Row - Reverse Direction */}
        <div className="marquee-container mt-6">
          <motion.div
            initial={animations.fadeIn.initial}
            whileInView={animations.fadeIn.animate}
            viewport={viewport}
            transition={{ ...animations.fadeIn.transition, delay: 0.3 }}
            className="flex animate-marquee-slow"
            style={{ animationDirection: "reverse" }}
          >
            {[...doubledSkills].reverse().map((skill, index) => (
              <SkillItem key={`${skill.name}-reverse-${index}`} skill={skill} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/**
 * Individual skill item component
 */
function SkillItem({ skill }: { skill: typeof skills[0] }) {
  return (
    <div className="flex-shrink-0 mx-6 lg:mx-8">
      <div className="flex flex-col items-center justify-center group">
        <div className="relative w-10 h-10 lg:w-12 lg:h-12 mb-2 opacity-60 group-hover:opacity-100 transition-opacity">
          <Image
            src={skill.iconSrc}
            alt={skill.name}
            fill
            className="object-contain"
          />
        </div>
        <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors text-center">
          {skill.name}
        </span>
      </div>
    </div>
  );
}
