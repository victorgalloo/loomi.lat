"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useScroll } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HeroSection } from "./HeroSection";
import { ProjectSection } from "./ProjectSection";
import { NavigationDots, ProgressBar } from "./NavigationDots";
import { CTASection } from "./CTASection";
import { projects } from "@/data/landing";
import type { Language } from "@/types/landing";

/**
 * Main Selected Work page component with scroll snap and navigation
 */
export function SelectedWorkPage() {
  const [language, setLanguage] = useState<Language>("ES");
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Total sections: Hero + Projects + CTA
  const totalSections = 1 + projects.length + 1;

  // Navigation labels
  const sectionLabels = [
    language === "EN" ? "Intro" : "Inicio",
    ...projects.map((p) =>
      typeof p.name === "string" ? p.name : p.name[language]
    ),
    language === "EN" ? "Contact" : "Contacto",
  ];

  // Track scroll progress for mobile progress bar
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      setProgress(v);
      // Calculate active section based on scroll progress
      const sectionIndex = Math.min(
        Math.floor(v * totalSections),
        totalSections - 1
      );
      setActiveSection(sectionIndex);
    });
    return () => unsubscribe();
  }, [scrollYProgress, totalSections]);

  // Handle dot click - scroll to section
  const handleDotClick = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const sectionHeight = container.scrollHeight / totalSections;
    container.scrollTo({
      top: sectionHeight * index,
      behavior: "smooth",
    });
  }, [totalSections]);

  // Detect language from browser
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("es")) {
      setLanguage("ES");
    } else {
      setLanguage("EN");
    }
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        const nextSection = Math.min(activeSection + 1, totalSections - 1);
        handleDotClick(nextSection);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        const prevSection = Math.max(activeSection - 1, 0);
        handleDotClick(prevSection);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSection, totalSections, handleDotClick]);

  return (
    <div className="relative">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200 text-gray-700 hover:text-[#FF3621] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">anthana.agency</span>
      </Link>

      {/* Language Toggle */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-gray-200">
        <button
          onClick={() => setLanguage("EN")}
          className={`text-sm font-medium px-2 py-1 rounded-full transition-colors ${
            language === "EN"
              ? "bg-[#FF3621] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage("ES")}
          className={`text-sm font-medium px-2 py-1 rounded-full transition-colors ${
            language === "ES"
              ? "bg-[#FF3621] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          ES
        </button>
      </div>

      {/* Progress Bar (Mobile) */}
      <ProgressBar progress={progress} />

      {/* Navigation Dots (Desktop) */}
      <NavigationDots
        totalSections={totalSections}
        activeSection={activeSection}
        onDotClick={handleDotClick}
        labels={sectionLabels}
      />

      {/* Main Scrollable Container */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-auto overflow-x-hidden scroll-smooth snap-y snap-mandatory"
      >
        {/* Hero Section */}
        <HeroSection language={language} />

        {/* Project Sections */}
        {projects.map((project, index) => (
          <ProjectSection
            key={project.id}
            project={project}
            index={index}
            totalProjects={projects.length}
            language={language}
            isActive={activeSection === index + 1}
          />
        ))}

        {/* CTA Section */}
        <CTASection language={language} />
      </div>
    </div>
  );
}
