"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import type { Language } from "@/types/landing";
import { getTranslations } from "@/lib/translations";
import { company, styles } from "@/lib/constants";

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

/**
 * Fixed header with navigation and language switcher
 */
export default function Header({ language, onLanguageChange }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = getTranslations("header", language);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#services", label: t.services },
    { href: "#projects", label: t.projects },
    { href: "#team", label: t.team },
    { href: "#contact", label: t.contact },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-200"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl lg:text-2xl font-bold text-gray-900">
              {company.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <LanguageSwitcher 
              language={language} 
              onLanguageChange={onLanguageChange}
              className="hidden sm:flex"
            />

            {/* CTA Button */}
            <a
              href="#contact"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#FF3621] rounded-full hover:bg-[#FF3621]/90 transition-all duration-300 hover:-translate-y-0.5"
            >
              {t.cta}
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        navLinks={navLinks}
        language={language}
        onLanguageChange={onLanguageChange}
        onClose={closeMobileMenu}
        ctaLabel={t.cta}
      />
    </motion.header>
  );
}

/**
 * Language switcher component
 */
interface LanguageSwitcherProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  className?: string;
  showLabels?: boolean;
}

function LanguageSwitcher({ 
  language, 
  onLanguageChange, 
  className = "",
  showLabels = false 
}: LanguageSwitcherProps) {
  const languages: { code: Language; label: string; shortLabel: string }[] = [
    { code: "EN", label: "English", shortLabel: "EN" },
    { code: "ES", label: "Español", shortLabel: "ES" },
  ];

  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      {languages.map((lang, index) => (
        <span key={lang.code} className="flex items-center">
          <button
            onClick={() => onLanguageChange(lang.code)}
            className={`px-2 py-1 rounded transition-colors ${
              language === lang.code
                ? "text-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {showLabels ? lang.label : lang.shortLabel}
          </button>
          {index < languages.length - 1 && (
            <span className="text-gray-300">/</span>
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * Mobile menu component
 */
interface MobileMenuProps {
  isOpen: boolean;
  navLinks: Array<{ href: string; label: string }>;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onClose: () => void;
  ctaLabel: string;
}

function MobileMenu({ 
  isOpen, 
  navLinks, 
  language, 
  onLanguageChange, 
  onClose,
  ctaLabel 
}: MobileMenuProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        height: isOpen ? "auto" : 0,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ duration: 0.3 }}
      className="lg:hidden overflow-hidden bg-white border-b border-gray-200"
    >
      <div className="px-6 py-4 space-y-4">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="block text-base font-medium text-gray-900 hover:text-[#FF3621] transition-colors"
          >
            {link.label}
          </a>
        ))}
        
        {/* Mobile Language Switcher */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">Language:</span>
          <LanguageSwitcher 
            language={language} 
            onLanguageChange={onLanguageChange}
            showLabels
          />
        </div>

        {/* Mobile CTA */}
        <a
          href="#contact"
          onClick={onClose}
          className="block w-full text-center px-5 py-3 text-sm font-semibold text-white bg-[#FF3621] rounded-full"
        >
          {ctaLabel}
        </a>
      </div>
    </motion.div>
  );
}
