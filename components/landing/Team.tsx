"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Linkedin } from "lucide-react";
import type { Language, TeamMember } from "@/types/landing";
import { getTranslations } from "@/lib/translations";
import { teamMembers } from "@/data/landing";
import { Container, SectionHeader } from "./shared";
import { animations, viewport, styles } from "@/lib/constants";

interface TeamProps {
  language: Language;
}

/**
 * Team section showcasing team members
 */
export default function Team({ language }: TeamProps) {
  const t = getTranslations("team", language);

  return (
    <section id="team" className="py-24 lg:py-32 relative bg-gray-50">
      <Container>
        <SectionHeader title={t.title} subtitle={t.subtitle} />

        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <TeamMemberCard 
              key={member.name} 
              member={member} 
              language={language}
              index={index}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

/**
 * Individual team member card
 */
interface TeamMemberCardProps {
  member: TeamMember;
  language: Language;
  index: number;
}

function TeamMemberCard({ member, language, index }: TeamMemberCardProps) {
  return (
    <motion.div
      initial={animations.fadeInUp.initial}
      whileInView={animations.fadeInUp.animate}
      viewport={viewport}
      transition={{ ...animations.fadeInUp.transition, delay: index * 0.1 }}
      className="group"
    >
      <div className={styles.card}>
        {/* Profile Image */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-[#FF3621] transition-colors">
            <Image
              src={member.image}
              alt={member.name}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Name & Role */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {member.name}
          </h3>
          <p className="text-sm text-[#FF3621] font-medium">
            {member.role[language]}
          </p>
        </div>

        {/* Experience Timeline */}
        <div className="space-y-3 mb-6">
          {member.experience.slice(0, 3).map((exp, expIndex) => (
            <div key={expIndex} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[#FF3621]/50" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {exp.title}
                </p>
                <p className="text-xs text-gray-500">
                  {exp.company} • {exp.period}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Social Links */}
        {member.social.linkedin && (
          <div className="flex items-center justify-center">
            <a
              href={member.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label={`${member.name}'s LinkedIn`}
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}
