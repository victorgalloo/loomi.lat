// =============================================================================
// Landing Page Static Data
// =============================================================================

import { Database, Globe, Bot, Sparkles, Zap, Shield, Code } from "lucide-react";
import type { TeamMember, Skill, Project, ServiceTab } from "@/types/landing";

/**
 * Team members data
 */
export const teamMembers: TeamMember[] = [
  {
    name: "Carlos",
    image: "/images/carlos.jpg",
    role: { EN: "Co-founder & iOS Engineer", ES: "Co-fundador & Ingeniero iOS" },
    experience: [
      { title: "Co-founder", company: "Anthana", period: "2024 - Present" },
      { title: "iOS Engineer", company: "Disney Cruise Line", period: "2022 - 2024" },
      { title: "iOS Engineer", company: "Citibanamex", period: "2021 - 2022" },
      { title: "iOS Engineer", company: "11 Health", period: "2020 - 2021" },
    ],
    social: {
      linkedin: "https://www.linkedin.com/in/carloscardonadev",
    },
  },
  {
    name: "Victor",
    image: "/images/victor.jpeg",
    role: { EN: "Co-founder & Sales", ES: "Co-fundador & Ventas" },
    experience: [
      { title: "Co-founder", company: "Anthana", period: "2024 - Present" },
      { title: "Key Account Manager", company: "Konfio", period: "2025 - Present" },
      { title: "FX Institutional Sales", company: "GBM", period: "2023 - 2024" },
      { title: "Software Sales Executive", company: "Globant", period: "2022 - 2023" },
    ],
    social: {
      linkedin: "https://www.linkedin.com/in/victorgalloo",
    },
  },
  {
    name: "Juan",
    image: "/images/juan.jpg",
    role: { EN: "Co-founder & Data Scientist", ES: "Co-fundador & Científico de Datos" },
    experience: [
      { title: "Co-founder", company: "Anthana", period: "2024 - Present" },
      { title: "Data Scientist", company: "Bimbo", period: "2020 - Present" },
      { title: "Databricks Expert Certified", company: "Databricks", period: "2025" },
    ],
    social: {
      linkedin: "https://www.linkedin.com/in/jjcardon",
    },
  },
];

/**
 * Technologies/Skills data
 */
export const skills: Skill[] = [
  { name: "Databricks", iconSrc: "/logos/databricks.svg" },
  { name: "Azure", iconSrc: "/logos/azure.svg" },
  { name: "Python", iconSrc: "/logos/python.svg" },
  { name: "Next.js", iconSrc: "/logos/next.svg" },
  { name: "TypeScript", iconSrc: "/logos/typescript.svg" },
  { name: "React", iconSrc: "/logos/react.svg" },
  { name: "Docker", iconSrc: "/logos/docker.svg" },
  { name: "MongoDB", iconSrc: "/logos/mongo.svg" },
  { name: "PostgreSQL", iconSrc: "/logos/postgresql.svg" },
  { name: "Tailwind", iconSrc: "/logos/tailwind.svg" },
  { name: "AWS", iconSrc: "/logos/aws.svg" },
  { name: "Power BI", iconSrc: "/logos/powerbi.svg" },
  { name: "Swift", iconSrc: "/logos/swift.svg" },
  { name: "Xcode", iconSrc: "/logos/Xcode.svg" },
  { name: "Firebase", iconSrc: "/logos/firebase.svg" },
  { name: "Figma", iconSrc: "/logos/figma.svg" },
  { name: "Jira", iconSrc: "/logos/jira.svg" },
];

/**
 * Trusted companies logos for hero section
 */
export const trustedLogos = [
  { name: "Databricks", src: "/logos/databricks.svg" },
  { name: "Azure", src: "/logos/azure.svg" },
  { name: "Next.js", src: "/logos/next.svg" },
];

/**
 * Projects data
 */
export const projects: Project[] = [
  {
    id: "loomi",
    name: "Loomi",
    tagline: {
      EN: "Your AI assistant that closes deals on WhatsApp",
      ES: "Tu asistente de IA que cierra tratos en WhatsApp"
    },
    description: {
      EN: "AI-powered WhatsApp agent that responds to your leads, qualifies prospects, and schedules meetings automatically. Never miss an opportunity to close.",
      ES: "Agente de IA en WhatsApp que responde a tus leads, califica prospectos y agenda reuniones automáticamente. Nunca pierdas una oportunidad de cerrar."
    },
    tech: ["AI Agents", "WhatsApp API", "Node.js", "OpenAI"],
    imageSrc: "/assets/loomi/chat-completo.png",
    images: ["/assets/loomi/chat-completo.png"],
    hasLandingPage: true,
    landingUrl: "/loomi",
    useHeroAnimation: true,
    customBackground: {
      logoSrc: "",
      bgColor: "#050505",
      accentColor: "#00FF66",
    },
  },
  {
    id: "syntra",
    name: "Syntra",
    tagline: {
      EN: "Ask questions directly to your sales data.",
      ES: "Haz preguntas directamente a tus datos de ventas."
    },
    description: {
      EN: "Enterprise conversational AI platform built on Databricks. Query complex datasets using natural language—no SQL required.",
      ES: "Plataforma de IA conversacional empresarial construida sobre Databricks. Consulta datos complejos con lenguaje natural, sin necesidad de SQL."
    },
    tech: ["Databricks", "Azure", "AI Agents", "Next.js"],
    imageSrc: "/images/Syntra.jpg",
    images: ["/images/Syntra.jpg", "/images/Syntra 2.png"],
    videoSrc: "/videos/Syntra promo_1.mp4",
    hasLandingPage: true,
    landingUrl: "/syntra",
  },
  {
    id: "aona",
    name: "aona",
    tagline: { 
      EN: "Daily focus, lasting change", 
      ES: "Enfoque diario, cambio duradero" 
    },
    description: {
      EN: "Aona is an iOS app for daily goals. The user defines one goal per day and visualizes it in a customizable widget on the home screen.",
      ES: "Aona es una app iOS para objetivos diarios. El usuario define un objetivo cada día y lo visualiza en un widget personalizable en la pantalla de inicio."
    },
    tech: ["SwiftUI", "WidgetKit", "iOS 26", "Xcode"],
    imageSrc: "/images/aona.png",
    images: ["/images/aona.png"],
    liveUrl: "https://apps.apple.com/mx/app/aona/id6754709178?l=en-GB",
  },
  {
    id: "livscore",
    name: "livscore",
    tagline: {
      EN: "Check scores, stats and more of LFC",
      ES: "Revisa marcadores, estadísticas y más de LFC"
    },
    description: {
      EN: "Custom dashboard platform that aggregates data from multiple sources, providing actionable insights with AI-powered recommendations.",
      ES: "Plataforma de dashboard personalizada que agrega datos de múltiples fuentes, proporcionando insights accionables con recomendaciones potenciadas por IA."
    },
    tech: ["UIKit", "Real-Time", "Xcode"],
    imageSrc: "/images/livscore.png",
    images: ["/images/livscore.png"],
    backgroundSrc: "/images/livscore-banner.png",
  },
  {
    id: "adriaco",
    name: { EN: "Shipping App", ES: "App de Envíos" },
    tagline: {
      EN: "Shipping management in one place",
      ES: "Gestión de envíos en un solo lugar"
    },
    description: {
      EN: "Web application for shipping and package management with EnviaTodo API integration, built with Next.js and Supabase",
      ES: "Aplicación web para gestión de envíos y paquetes con integración a EnviaTodo API, construida con Next.js y Supabase"
    },
    tech: ["API", "Next.js", "Supabase"],
    imageSrc: "/images/adriaco 3.png",
    images: ["/images/adriaco 1.png", "/images/adriaco 2.png", "/images/adriaco 3.png"],
  },
  {
    id: "fademex",
    name: "Fademex",
    tagline: {
      EN: "Leading the clean energy revolution",
      ES: "Liderando la revolución de energía limpia"
    },
    description: {
      EN: "Complete web platform for a leading solar panel company including corporate landing page, client portal, and interactive coverage map. Fademex is a leader in clean energy and solar technology implementation.",
      ES: "Plataforma web completa para empresa líder en paneles solares incluyendo landing page corporativa, portal de clientes y mapa interactivo de cobertura. Fademex es líder en energía limpia e implementación de tecnología solar."
    },
    tech: ["Next.js", "React", "Mapbox", "Tailwind"],
    imageSrc: "/assets/icons/FADEMEX LOGOTIPOS -03.svg",
    images: ["/assets/icons/FADEMEX LOGOTIPOS -03.svg"],
    liveUrl: "https://www.fademex.com",
    customBackground: {
      logoSrc: "/assets/icons/FADEMEX LOGOTIPOS -03.svg",
      bgColor: "#f0f4e8",
      accentColor: "#2e2e30",
    },
  },
];

/**
 * Services tabs data - English
 */
export const serviceTabsEN: ServiceTab[] = [
  {
    id: "data",
    label: "Data & AI",
    icon: Database,
    title: "Data & AI Automation",
    description: "Transform your data infrastructure with automated pipelines, intelligent analytics, and AI-powered insights. We specialize in Databricks, Azure, and building custom data solutions that scale.",
    features: [
      { icon: Sparkles, text: "Data Lakehouse Architecture" },
      { icon: Zap, text: "ETL Pipeline Automation" },
      { icon: Shield, text: "Data Governance & Security" },
      { icon: Code, text: "Custom Analytics Solutions" },
    ],
  },
  {
    id: "web",
    label: "Web & Mobile",
    icon: Globe,
    title: "Web & Mobile Development",
    description: "Build powerful web applications and native mobile apps. From modern web platforms with Next.js to iOS apps with SwiftUI, we deliver user-centric digital experiences.",
    features: [
      { icon: Sparkles, text: "Modern React/Next.js Apps" },
      { icon: Zap, text: "Native iOS Development" },
      { icon: Shield, text: "Secure Authentication" },
      { icon: Code, text: "API Integration" },
    ],
  },
  {
    id: "agents",
    label: "AI Agents",
    icon: Bot,
    title: "AI Agent Development",
    description: "Develop intelligent AI agents that automate workflows, enhance productivity, and enable natural language interactions with your data and systems.",
    features: [
      { icon: Sparkles, text: "Custom LLM Integration" },
      { icon: Zap, text: "Workflow Automation" },
      { icon: Shield, text: "Enterprise Security" },
      { icon: Code, text: "Natural Language Interfaces" },
    ],
  },
];

/**
 * Services tabs data - Spanish
 */
export const serviceTabsES: ServiceTab[] = [
  {
    id: "data",
    label: "Datos e IA",
    icon: Database,
    title: "Automatización de Datos e IA",
    description: "Transforma tu infraestructura de datos con pipelines automatizados, análisis inteligentes e insights potenciados por IA. Nos especializamos en Databricks, Azure y soluciones de datos personalizadas que escalan.",
    features: [
      { icon: Sparkles, text: "Arquitectura Data Lakehouse" },
      { icon: Zap, text: "Automatización de Pipelines ETL" },
      { icon: Shield, text: "Gobernanza y Seguridad de Datos" },
      { icon: Code, text: "Soluciones de Análisis Personalizadas" },
    ],
  },
  {
    id: "web",
    label: "Web y Móvil",
    icon: Globe,
    title: "Desarrollo Web y Móvil",
    description: "Construye aplicaciones web potentes y apps móviles nativas. Desde plataformas web modernas con Next.js hasta apps iOS con SwiftUI, entregamos experiencias digitales centradas en el usuario.",
    features: [
      { icon: Sparkles, text: "Apps Modernas React/Next.js" },
      { icon: Zap, text: "Desarrollo Nativo iOS" },
      { icon: Shield, text: "Autenticación Segura" },
      { icon: Code, text: "Integración de APIs" },
    ],
  },
  {
    id: "agents",
    label: "Agentes IA",
    icon: Bot,
    title: "Desarrollo de Agentes de IA",
    description: "Desarrolla agentes de IA inteligentes que automatizan flujos de trabajo, mejoran la productividad y permiten interacciones en lenguaje natural con tus datos y sistemas.",
    features: [
      { icon: Sparkles, text: "Integración LLM Personalizada" },
      { icon: Zap, text: "Automatización de Flujos" },
      { icon: Shield, text: "Seguridad Empresarial" },
      { icon: Code, text: "Interfaces de Lenguaje Natural" },
    ],
  },
];

/**
 * Get service tabs by language
 */
export const getServiceTabs = (language: "EN" | "ES"): ServiceTab[] => {
  return language === "EN" ? serviceTabsEN : serviceTabsES;
};


