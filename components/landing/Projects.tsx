"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Play, Bot, MessageCircle } from "lucide-react";
import type { Language } from "@/types/landing";
import { getTranslations } from "@/lib/translations";
import { projects } from "@/data/landing";
import { Container, SectionHeader } from "./shared";
import { animations, viewport } from "@/lib/constants";

/**
 * Loomi Hero Animation Background - Light Mode
 */
function LoomiHeroAnimation() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#f0fdf4] via-[#ecfdf5] to-[#d1fae5] overflow-hidden">
      {/* Gradient orbs - softer for light mode */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#10b981]/30 rounded-full blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#06b6d4]/25 rounded-full blur-[100px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-64 h-64 bg-[#8b5cf6]/20 rounded-full blur-[80px]"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid pattern - subtle for light mode */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating chat bubbles */}
      <motion.div
        className="absolute top-[20%] right-[15%] bg-[#10b981] text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm font-medium shadow-lg shadow-[#10b981]/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
      >
        ¡Hola! ¿En qué puedo ayudarte?
      </motion.div>

      <motion.div
        className="absolute bottom-[30%] left-[10%] bg-white/90 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-2xl rounded-bl-sm text-sm border border-gray-200 shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, delay: 1.5 }}
      >
        Quiero agendar una demo
      </motion.div>

      <motion.div
        className="absolute top-[45%] right-[25%] bg-[#10b981] text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm font-medium shadow-lg shadow-[#10b981]/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 2.5, delay: 3 }}
      >
        ¡Perfecto! ¿Mañana a las 10am?
      </motion.div>

      {/* Floating icons */}
      <motion.div
        className="absolute top-[15%] left-[20%]"
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-12 h-12 rounded-xl bg-white/80 border border-[#10b981]/30 flex items-center justify-center shadow-lg shadow-[#10b981]/10">
          <Bot className="w-6 h-6 text-[#10b981]" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-[25%] right-[10%]"
        animate={{ y: [0, -8, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="w-10 h-10 rounded-lg bg-white/80 border border-[#06b6d4]/30 flex items-center justify-center shadow-lg shadow-[#06b6d4]/10">
          <MessageCircle className="w-5 h-5 text-[#06b6d4]" />
        </div>
      </motion.div>

      {/* Scan line effect - subtle for light mode */}
      <motion.div
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#10b981]/40 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* WhatsApp phone mockup hint */}
      <motion.div
        className="absolute right-[5%] top-1/2 -translate-y-1/2 hidden lg:block"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <div className="w-48 h-80 bg-white/60 backdrop-blur-sm rounded-[2rem] border border-white/80 shadow-2xl shadow-black/10 p-2">
          <div className="w-full h-full bg-gradient-to-b from-[#075e54] to-[#128c7e] rounded-[1.5rem] flex flex-col overflow-hidden">
            {/* WhatsApp header */}
            <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center">
                <span className="text-white text-xs font-bold">L</span>
              </div>
              <span className="text-white text-sm font-medium">Loomi</span>
            </div>
            {/* Chat area */}
            <div className="flex-1 bg-[#ece5dd] p-2 space-y-2">
              <motion.div
                className="bg-white rounded-lg px-2 py-1 text-[10px] text-gray-700 max-w-[80%] shadow-sm"
                animate={{ opacity: [0, 1] }}
                transition={{ delay: 1 }}
              >
                Hola, vi su anuncio
              </motion.div>
              <motion.div
                className="bg-[#dcf8c6] rounded-lg px-2 py-1 text-[10px] text-gray-700 max-w-[80%] ml-auto shadow-sm"
                animate={{ opacity: [0, 1] }}
                transition={{ delay: 1.5 }}
              >
                ¡Hola! Te cuento más
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface ProjectsProps {
  language: Language;
}

/**
 * Cinematic projects section - teaser for /selected-work
 */
export default function Projects({ language }: ProjectsProps) {
  const router = useRouter();
  const t = getTranslations("projects", language);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  // Featured projects (Syntra and Loomi)
  const loomi = projects.find(p => p.id === "loomi")!;
  const syntra = projects.find(p => p.id === "syntra")!;
  const featuredProjects = [syntra, loomi];

  // Other projects (exclude featured ones)
  const otherProjects = projects.filter(p => p.id !== "loomi" && p.id !== "syntra");

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="py-24 lg:py-32 relative bg-gray-50 overflow-hidden"
    >
      {/* Subtle animated background */}
      <motion.div
        className="absolute inset-0 opacity-50"
        style={{ y: backgroundY }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF3621]/5 via-transparent to-gray-200/50" />
      </motion.div>

      <Container className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t.title}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                {t.subtitle}
              </p>
            </div>
            <button
              onClick={() => router.push("/selected-work")}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#FF3621] border border-gray-200 hover:border-[#FF3621]/30 rounded-full transition-all shrink-0"
            >
              {t.viewAll}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Featured Projects - Two Cinematic Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {featuredProjects.map((featured, idx) => {
            const featuredName = typeof featured.name === "string"
              ? featured.name
              : featured.name[language];

            return (
              <motion.div
                key={featured.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="relative group cursor-pointer"
                onClick={() => router.push(featured.landingUrl || "/selected-work")}
              >
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
                  {/* Background Image/Video/Animation */}
                  {featured.useHeroAnimation ? (
                    <LoomiHeroAnimation />
                  ) : featured.videoSrc ? (
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    >
                      <source src={featured.videoSrc} type="video/mp4" />
                    </video>
                  ) : (
                    <Image
                      src={featured.imageSrc}
                      alt={featuredName}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                  )}

                  {/* Gradient Overlays */}
                  {!featured.useHeroAnimation && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    </>
                  )}
                  {featured.useHeroAnimation && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </>
                  )}

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                    <div className="max-w-xl">
                      {/* Project Number */}
                      <motion.span
                        className={`inline-block text-xs font-bold tracking-widest mb-2 ${
                          featured.useHeroAnimation ? 'text-[#00FF66]' : 'text-[#FF3621]'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                      >
                        {String(idx + 1).padStart(2, "0")} — FEATURED
                      </motion.span>

                      {/* Title */}
                      <motion.h3
                        className="text-3xl md:text-4xl font-bold text-white mb-2"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                      >
                        {featuredName}
                      </motion.h3>

                      {/* Tagline */}
                      <motion.p
                        className="text-base md:text-lg text-white/80 mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                      >
                        {featured.tagline[language]}
                      </motion.p>

                      {/* Tech badges */}
                      <motion.div
                        className="flex flex-wrap gap-2"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                      >
                        {featured.tech.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 text-xs font-medium text-white/70 bg-white/10 backdrop-blur-sm rounded-full border border-white/10"
                          >
                            {tech}
                          </span>
                        ))}
                      </motion.div>
                    </div>
                  </div>

                  {/* Play/View indicator */}
                  <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Other Projects - Compact Horizontal Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {otherProjects.map((project, index) => {
            const name = typeof project.name === "string"
              ? project.name
              : project.name[language];

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="group cursor-pointer"
                onClick={() => router.push("/selected-work")}
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                  <Image
                    src={project.imageSrc}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Number overlay */}
                  <div className="absolute top-3 left-3">
                    <span className="text-2xl font-bold text-white/40">
                      {String(index + 3).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-[#FF3621]/0 group-hover:bg-[#FF3621]/20 transition-colors duration-300" />
                </div>

                <h4 className="text-gray-900 font-semibold group-hover:text-[#FF3621] transition-colors">
                  {name}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {project.tagline[language]}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <motion.button
            onClick={() => router.push("/selected-work")}
            className="group relative inline-flex items-center gap-3 px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-[#FF3621] to-[#FF6B35] rounded-full overflow-hidden shadow-xl shadow-[#FF3621]/25"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              initial={{ x: "-200%" }}
              animate={{ x: "200%" }}
              transition={{
                repeat: Infinity,
                repeatDelay: 3,
                duration: 1,
                ease: "easeInOut",
              }}
            />

            <span className="relative z-10">{t.viewAll}</span>

            <span className="relative z-10 flex items-center justify-center w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm">
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </motion.button>

          <p className="mt-4 text-sm text-gray-500">
            {language === "EN" ? "5 projects • Interactive experience" : "5 proyectos • Experiencia interactiva"}
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
