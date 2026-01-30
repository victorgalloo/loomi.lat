"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Globe, Bot, ArrowRight } from "lucide-react";
import type { Language, ServiceTab } from "@/types/landing";
import { getTranslations } from "@/lib/translations";
import { getServiceTabs } from "@/data/landing";
import { Container, SectionHeader } from "./shared";
import { animations, viewport, links } from "@/lib/constants";

interface ServicesProps {
  language: Language;
}

/**
 * Services section with tabbed content and animations
 */
export default function Services({ language }: ServicesProps) {
  const [activeTab, setActiveTab] = useState("data");
  const t = getTranslations("services", language);
  const tabs = getServiceTabs(language);
  const activeService = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <section id="services" className="py-24 lg:py-32 relative overflow-hidden">
      <Container className="relative z-10">
        <SectionHeader title={t.title} subtitle={t.subtitle} />

        {/* Tabs */}
        <motion.div
          {...animations.fadeInUpDelayed(0.1)}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Text Content */}
            <ServiceContent 
              service={activeService} 
              language={language}
              showLearnMore={activeTab === "data"}
            />

            {/* Visual Animation */}
            <ServiceVisual activeTab={activeTab} />
          </motion.div>
        </AnimatePresence>
      </Container>
    </section>
  );
}

/**
 * Tab button component
 */
interface TabButtonProps {
  tab: ServiceTab;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ tab, isActive, onClick }: TabButtonProps) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
        isActive
          ? "bg-[#FF3621] text-white"
          : "bg-gray-100 border border-gray-200 text-gray-600 hover:border-[#FF3621]/50 hover:text-gray-900"
      }`}
    >
      <Icon className="w-4 h-4" />
      {tab.label}
    </button>
  );
}

/**
 * Service content component
 */
interface ServiceContentProps {
  service: ServiceTab;
  language: Language;
  showLearnMore: boolean;
}

function ServiceContent({ service, language, showLearnMore }: ServiceContentProps) {
  const t = getTranslations("services", language);
  const Icon = service.icon;

  return (
    <div className="space-y-6">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF3621]/10 border border-[#FF3621]/20">
        <Icon className="w-4 h-4 text-[#FF3621]" />
        <span className="text-sm font-medium text-[#FF3621]">{service.label}</span>
      </div>

      {/* Title & Description */}
      <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">
        {service.title}
      </h3>
      <p className="text-lg text-gray-600 leading-relaxed">
        {service.description}
      </p>

      {/* Features */}
      <div className="grid sm:grid-cols-2 gap-4 pt-4">
        {service.features.map((feature, index) => {
          const FeatureIcon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FF3621]/10 flex items-center justify-center">
                <FeatureIcon className="w-4 h-4 text-[#FF3621]" />
              </div>
              <span className="text-sm text-gray-700">{feature.text}</span>
            </motion.div>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-4 mt-6">
        <a
          href="#contact"
          className="inline-flex items-center gap-2 text-[#FF3621] font-medium hover:gap-3 transition-all"
        >
          {t.getStarted}
          <ArrowRight className="w-4 h-4" />
        </a>
        {showLearnMore && (
          <a
            href={links.databricksPage}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#FF3621] rounded-full hover:bg-[#FF3621]/90 transition-all"
          >
            {t.learnMore}
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Service visual animations component
 */
function ServiceVisual({ activeTab }: { activeTab: string }) {
  return (
    <div className="relative">
      <div className="relative aspect-square max-w-md mx-auto">
        {activeTab === "data" && <DataAnimation />}
        {activeTab === "web" && <WebAnimation />}
        {activeTab === "agents" && <AgentsAnimation />}
      </div>
    </div>
  );
}

/**
 * Data & AI Animation
 */
function DataAnimation() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {/* Database Icon */}
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FF3621] to-[#FF6B35] flex items-center justify-center shadow-xl">
          <Database className="w-12 h-12 text-white" />
        </div>
        
        {/* Floating Cards */}
        <FloatingCard 
          className="absolute -top-16 -right-16 w-20 h-14"
          animateY={[-5, 5, -5]}
          duration={3}
        >
          <div className="flex gap-1 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          </div>
          <div className="space-y-1">
            <div className="h-1.5 bg-gray-200 rounded w-full" />
            <div className="h-1.5 bg-[#FF3621]/30 rounded w-3/4" />
          </div>
        </FloatingCard>
        
        <FloatingCard 
          className="absolute -bottom-14 -left-14 w-24 h-16"
          animateY={[5, -5, 5]}
          duration={4}
        >
          <div className="flex items-end gap-1 h-full">
            {[40, 70, 50, 90, 60].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex-1 bg-gradient-to-t from-[#FF3621] to-[#FF6B35] rounded-sm"
              />
            ))}
          </div>
        </FloatingCard>
      </motion.div>
    </div>
  );
}

/**
 * Web & Mobile Animation
 */
function WebAnimation() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {/* Browser Window */}
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-48 h-32 rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
        >
          <div className="h-6 bg-gray-100 border-b border-gray-200 flex items-center px-2 gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <div className="flex-1 mx-2 h-3 bg-gray-200 rounded" />
          </div>
          <div className="p-2 space-y-2">
            <div className="h-2 bg-[#FF3621]/20 rounded w-3/4" />
            <div className="h-2 bg-gray-200 rounded w-full" />
            <div className="h-2 bg-gray-200 rounded w-2/3" />
            <div className="flex gap-2 mt-2">
              <div className="h-8 flex-1 bg-[#FF3621]/10 rounded" />
              <div className="h-8 flex-1 bg-gray-100 rounded" />
            </div>
          </div>
        </motion.div>

        {/* Mobile Phone */}
        <motion.div
          animate={{ y: [3, -3, 3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -bottom-8 -right-12 w-20 h-36 rounded-2xl bg-gray-900 shadow-2xl p-1"
        >
          <div className="w-full h-full rounded-xl bg-white overflow-hidden">
            <div className="h-4 bg-gray-100 flex justify-center">
              <div className="w-8 h-2 bg-gray-900 rounded-b-lg" />
            </div>
            <div className="p-1.5 space-y-1.5">
              <div className="h-6 bg-[#FF3621] rounded" />
              <div className="h-1.5 bg-gray-200 rounded w-full" />
              <div className="h-1.5 bg-gray-200 rounded w-3/4" />
              <div className="grid grid-cols-2 gap-1 mt-2">
                <div className="h-6 bg-gray-100 rounded" />
                <div className="h-6 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Code Tag */}
        <motion.div
          animate={{ x: [-3, 3, -3], y: [-2, 2, -2] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute -top-8 -left-8 px-3 py-1.5 rounded-lg bg-gray-900 shadow-lg"
        >
          <code className="text-xs text-green-400">&lt;/&gt;</code>
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * AI Agents Animation
 */
function AgentsAnimation() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {/* Central Bot */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF3621] to-[#FF6B35] flex items-center justify-center shadow-xl"
        >
          <Bot className="w-12 h-12 text-white" />
        </motion.div>

        {/* Thinking Dots */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 px-3 py-2 bg-white rounded-full shadow-lg"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              className="w-2 h-2 rounded-full bg-[#FF3621]"
            />
          ))}
        </motion.div>

        {/* Chat Bubbles */}
        <ChatBubble 
          className="absolute -right-20 top-0"
          animateX={[-2, 2, -2]}
          animateY={[-3, 3, -3]}
          variant="user"
        />
        <ChatBubble 
          className="absolute -left-20 bottom-0"
          animateX={[2, -2, 2]}
          animateY={[3, -3, 3]}
          variant="bot"
        />

        {/* Neural Connections */}
        {[45, 135, 225, 315].map((angle, i) => (
          <motion.div
            key={angle}
            className="absolute top-1/2 left-1/2 w-16 h-0.5 origin-left"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <motion.div
              animate={{ opacity: [0.2, 0.6, 0.2], scaleX: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="w-full h-full bg-gradient-to-r from-[#FF3621] to-transparent rounded"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Floating card wrapper
 */
interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  animateY: number[];
  duration: number;
}

function FloatingCard({ children, className, animateY, duration }: FloatingCardProps) {
  return (
    <motion.div
      animate={{ y: animateY }}
      transition={{ duration, repeat: Infinity }}
      className={`rounded-lg bg-white shadow-lg border border-gray-100 p-2 ${className}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * Chat bubble component
 */
interface ChatBubbleProps {
  className: string;
  animateX: number[];
  animateY: number[];
  variant: "user" | "bot";
}

function ChatBubble({ className, animateX, animateY, variant }: ChatBubbleProps) {
  const isBot = variant === "bot";
  return (
    <motion.div
      animate={{ x: animateX, y: animateY }}
      transition={{ duration: isBot ? 3.5 : 4, repeat: Infinity }}
      className={`max-w-[100px] ${className}`}
    >
      <div className={`px-3 py-2 rounded-2xl shadow-lg ${
        isBot 
          ? "bg-[#FF3621] rounded-bl-sm" 
          : "bg-white border border-gray-100 rounded-br-sm"
      }`}>
        <div className="space-y-1">
          <div className={`h-1.5 rounded ${isBot ? "bg-white/40 w-14" : "bg-gray-200 w-16"}`} />
          <div className={`h-1.5 rounded ${isBot ? "bg-white/40 w-10" : "bg-gray-200 w-12"}`} />
        </div>
      </div>
    </motion.div>
  );
}
