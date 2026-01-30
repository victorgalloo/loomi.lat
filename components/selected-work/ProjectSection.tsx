"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ExternalLink, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { ParallaxImage } from "./ParallaxImage";
import { TextReveal } from "./TextReveal";
import { TechBadges } from "./TechBadges";
import { selectedWorkAnimations } from "@/lib/selected-work-animations";
import { getTranslations } from "@/lib/translations";
import type { Language, Project } from "@/types/landing";
import { cn } from "@/lib/utils";

// =============================================================================
// Loomi Animated Background Component - New Style
// =============================================================================

import { Bot, MessageCircle, Calendar, Sparkles } from "lucide-react";

const DEMO_MESSAGES = [
  { id: 1, type: "user", text: "Hola, vi su anuncio. ¿Cuánto cuesta?", time: "14:32" },
  { id: 2, type: "bot", text: "¡Hola! El plan Pro es $149/mes. ¿Cuántos mensajes recibes al mes?", time: "14:32" },
  { id: 3, type: "user", text: "Como 200-300 al día, no doy abasto", time: "14:33" },
  { id: 4, type: "bot", text: "Con ese volumen el Pro es perfecto. ¿Demo de 15 min mañana a las 10am?", time: "14:33" },
  { id: 5, type: "user", text: "Sí, mañana a las 10 va", time: "14:34" },
];

function LoomiAnimatedBackground() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Show messages one by one
    DEMO_MESSAGES.forEach((msg, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, msg.id]);
        }, i * 1200 + 500)
      );
    });

    // Show calendar at the end
    timers.push(setTimeout(() => setShowCalendar(true), 6500));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      {/* Phone Frame - Light mode */}
      <motion.div
        className="relative bg-gray-200 rounded-[2.5rem] p-2 shadow-xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />

        {/* Screen */}
        <div className="relative bg-white rounded-[2rem] overflow-hidden">
          {/* Header */}
          <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center">
              <span className="text-white font-bold">L</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Loomi</p>
              <p className="text-white/70 text-xs">Online</p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="h-[280px] p-3 space-y-2 overflow-hidden bg-[#ECE5DD]">
            <AnimatePresence>
              {DEMO_MESSAGES.map((msg) => {
                if (!visibleMessages.includes(msg.id)) return null;
                const isBot = msg.type === "bot";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${isBot ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg shadow-sm ${
                        isBot
                          ? "bg-white text-gray-800 rounded-bl-none"
                          : "bg-[#DCF8C6] text-gray-800 rounded-br-none"
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed">{msg.text}</p>
                      <p className="text-[10px] mt-0.5 text-gray-500 text-right">{msg.time}</p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Calendar Popup */}
              {showCalendar && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-x-3 bottom-3 bg-[#25D366] rounded-xl p-3 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Demo agendada</p>
                      <p className="text-white/80 text-xs">Mañana 10:00 AM</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface ProjectSectionProps {
  project: Project;
  index: number;
  totalProjects: number;
  language: Language;
  isActive?: boolean;
}

/**
 * Full-screen project section with parallax and animations
 * Supports video background for cinematic presentation
 */
export function ProjectSection({
  project,
  index,
  totalProjects,
  language,
  isActive = true,
}: ProjectSectionProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const t = getTranslations("selectedWork", language);

  const name = typeof project.name === "string"
    ? project.name
    : project.name[language];
  const tagline = project.tagline[language];
  const description = project.description[language];

  const hasVideo = !!project.videoSrc;
  const hasBackground = !!project.backgroundSrc;
  const hasCustomBackground = !!project.customBackground;
  const isLoomi = project.id === "loomi";

  // Loomi special variant - Light mode with WhatsApp style
  if (isLoomi) {
    return (
      <section
        id={`project-${index}`}
        className="min-h-screen flex items-center py-20 lg:py-0 snap-start snap-always relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-emerald-50/30"
      >
        {/* Background - Subtle gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-[#25D366]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-emerald-200/30 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Content */}
            <div className="order-2 lg:order-1">
              {/* Project Number */}
              <motion.div
                initial={selectedWorkAnimations.projectNumber.initial}
                whileInView={selectedWorkAnimations.projectNumber.animate}
                viewport={{ once: true }}
                className="flex items-center gap-3 mb-6"
              >
                <span className="text-5xl md:text-6xl font-bold text-[#25D366]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-lg text-gray-400">
                  {t.projectOf} {String(totalProjects).padStart(2, "0")}
                </span>
              </motion.div>

              {/* Project Name */}
              <TextReveal
                text={name}
                as="h2"
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900"
                delay={0.1}
              />

              {/* Tagline */}
              <motion.p
                initial={selectedWorkAnimations.projectContent.initial}
                whileInView={selectedWorkAnimations.projectContent.animate}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl mb-6 text-gray-700"
              >
                {tagline}
              </motion.p>

              {/* Description */}
              <motion.p
                initial={{ ...selectedWorkAnimations.projectContent.initial }}
                whileInView={{ ...selectedWorkAnimations.projectContent.animate }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-lg md:text-xl leading-relaxed mb-8 text-gray-500"
              >
                {description}
              </motion.p>

              {/* Tech Badges */}
              <div className="mb-8">
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-gray-400 uppercase tracking-wider mb-3 block"
                >
                  {t.techUsed}
                </motion.span>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech, i) => (
                    <motion.span
                      key={tech}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="px-3 py-1.5 text-sm font-medium rounded-full bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="flex flex-wrap gap-4"
              >
                {project.hasLandingPage && project.landingUrl && (
                  <button
                    onClick={() => router.push(project.landingUrl!)}
                    className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-[#25D366] rounded-full hover:bg-[#128C7E] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {t.viewLanding}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-gray-700 border-2 border-gray-200 rounded-full hover:border-[#25D366] hover:text-[#25D366] transition-all"
                  >
                    {t.liveDemo}
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </motion.div>
            </div>

            {/* Animated Phone */}
            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <LoomiAnimatedBackground />
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  // Custom background variant - SVG logo with custom colors
  if (hasCustomBackground && project.customBackground) {
    const { logoSrc, bgColor, accentColor } = project.customBackground;

    return (
      <section
        id={`project-${index}`}
        className="min-h-screen flex items-center py-20 lg:py-0 snap-start snap-always relative overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Logo in bottom right corner (if provided) */}
        {logoSrc && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <motion.div
              className="absolute bottom-8 right-8 lg:bottom-16 lg:right-16"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src={logoSrc}
                alt=""
                className="w-80 h-80 md:w-[28rem] md:h-[28rem] lg:w-[36rem] lg:h-[36rem] object-contain"
              />
            </motion.div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-2xl">
            {/* Project Number */}
            <motion.div
              initial={selectedWorkAnimations.projectNumber.initial}
              whileInView={selectedWorkAnimations.projectNumber.animate}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-6"
            >
              <span className="text-5xl md:text-6xl font-bold text-[#FF3621]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-lg text-gray-500">
                {t.projectOf} {String(totalProjects).padStart(2, "0")}
              </span>
            </motion.div>

            {/* Project Name */}
            <TextReveal
              text={name}
              as="h2"
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
              style={{ color: accentColor }}
              delay={0.1}
            />

            {/* Tagline */}
            <motion.p
              initial={selectedWorkAnimations.projectContent.initial}
              whileInView={selectedWorkAnimations.projectContent.animate}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl mb-6 text-gray-700"
            >
              {tagline}
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ ...selectedWorkAnimations.projectContent.initial }}
              whileInView={{ ...selectedWorkAnimations.projectContent.animate }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl leading-relaxed mb-8 text-gray-600"
            >
              {description}
            </motion.p>

            {/* Tech Badges */}
            <div className="mb-8">
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-sm text-gray-500 uppercase tracking-wider mb-3 block"
              >
                {t.techUsed}
              </motion.span>
              <TechBadges technologies={project.tech} variant="outline" />
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-[#FF3621] rounded-full hover:bg-[#FF3621]/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {t.liveDemo}
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
              {project.hasLandingPage && project.landingUrl && (
                <button
                  onClick={() => router.push(project.landingUrl!)}
                  className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-[#FF3621] border-2 border-[#FF3621]/30 rounded-full hover:border-[#FF3621] transition-all"
                >
                  {t.viewLanding}
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  // Cinematic variant - video or image background with dark overlay
  if (hasVideo || hasBackground) {
    return (
      <section
        id={`project-${index}`}
        className="min-h-screen flex items-center py-20 lg:py-0 snap-start snap-always relative overflow-hidden"
      >
        {/* Video or Image Background */}
        <div className="absolute inset-0 z-0">
          {hasVideo ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={project.videoSrc} type="video/mp4" />
            </video>
          ) : (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${project.backgroundSrc})` }}
            />
          )}
          {/* Dark Overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-2xl">
            {/* Project Number */}
            <motion.div
              initial={selectedWorkAnimations.projectNumber.initial}
              whileInView={selectedWorkAnimations.projectNumber.animate}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-6"
            >
              <span className="text-5xl md:text-6xl font-bold text-[#FF3621]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-lg text-white/60">
                {t.projectOf} {String(totalProjects).padStart(2, "0")}
              </span>
            </motion.div>

            {/* Project Name */}
            <TextReveal
              text={name}
              as="h2"
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
              delay={0.1}
            />

            {/* Tagline */}
            <motion.p
              initial={selectedWorkAnimations.projectContent.initial}
              whileInView={selectedWorkAnimations.projectContent.animate}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl text-white/90 mb-6"
            >
              {tagline}
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ ...selectedWorkAnimations.projectContent.initial }}
              whileInView={{ ...selectedWorkAnimations.projectContent.animate }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-white/70 leading-relaxed mb-8"
            >
              {description}
            </motion.p>

            {/* Tech Badges */}
            <div className="mb-8">
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-sm text-white/50 uppercase tracking-wider mb-3 block"
              >
                {t.techUsed}
              </motion.span>
              <TechBadges technologies={project.tech} variant="filled" />
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              {project.hasLandingPage && project.landingUrl && (
                <button
                  onClick={() => router.push(project.landingUrl!)}
                  className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-[#FF3621] rounded-full hover:bg-[#FF3621]/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {t.viewLanding}
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white border-2 border-white/30 rounded-full hover:border-white/60 transition-all"
                >
                  {t.liveDemo}
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </motion.div>
          </div>
        </div>

        {/* Decorative gradient on right */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#FF3621]/10 to-transparent pointer-events-none" />
      </section>
    );
  }

  // Standard image variant - light theme
  return (
    <section
      id={`project-${index}`}
      className="min-h-screen flex items-center py-20 lg:py-0 snap-start snap-always relative overflow-hidden bg-white"
    >
      {/* Background Number */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[20rem] md:text-[30rem] font-bold text-gray-100 select-none pointer-events-none leading-none -z-10">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-16 items-center">
          {/* Image - 60% on desktop */}
          <motion.div
            initial={selectedWorkAnimations.projectImage.initial}
            whileInView={selectedWorkAnimations.projectImage.animate}
            viewport={{ once: true, margin: "-100px" }}
            className={cn(
              "lg:col-span-3 relative",
              index % 2 === 1 && "lg:order-2"
            )}
          >
            <ParallaxImage
              src={project.imageSrc}
              alt={name}
              speed={0.2}
              className="aspect-[16/10] shadow-2xl"
              priority={index === 0}
              overlay
            />
          </motion.div>

          {/* Content - 40% on desktop */}
          <div
            className={cn(
              "lg:col-span-2 space-y-6",
              index % 2 === 1 && "lg:order-1"
            )}
          >
            {/* Project Number */}
            <motion.div
              initial={selectedWorkAnimations.projectNumber.initial}
              whileInView={selectedWorkAnimations.projectNumber.animate}
              viewport={{ once: true }}
              className="flex items-center gap-3"
            >
              <span className="text-4xl md:text-5xl font-bold text-[#FF3621]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-lg text-gray-400">
                {t.projectOf} {String(totalProjects).padStart(2, "0")}
              </span>
            </motion.div>

            {/* Project Name */}
            <TextReveal
              text={name}
              as="h2"
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900"
              delay={0.1}
            />

            {/* Tagline */}
            <motion.p
              initial={selectedWorkAnimations.projectContent.initial}
              whileInView={selectedWorkAnimations.projectContent.animate}
              viewport={{ once: true }}
              className="text-xl md:text-2xl text-gray-600"
            >
              {tagline}
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ ...selectedWorkAnimations.projectContent.initial }}
              whileInView={{ ...selectedWorkAnimations.projectContent.animate }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-base md:text-lg text-gray-500 leading-relaxed"
            >
              {description}
            </motion.p>

            {/* Tech Badges */}
            <div className="pt-2">
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-sm text-gray-400 uppercase tracking-wider mb-3 block"
              >
                {t.techUsed}
              </motion.span>
              <TechBadges technologies={project.tech} />
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              {project.hasLandingPage && project.landingUrl && (
                <button
                  onClick={() => router.push(project.landingUrl!)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-[#FF3621] rounded-full hover:bg-[#FF3621]/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {t.viewLanding}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-gray-700 border-2 border-gray-200 rounded-full hover:border-[#FF3621] hover:text-[#FF3621] transition-all"
                >
                  {t.liveDemo}
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
