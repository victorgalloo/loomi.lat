// =============================================================================
// Centralized Translations
// =============================================================================

import type { Language } from "@/types/landing";
import { company } from "./constants";

/**
 * All translations for the landing page
 */
export const translations = {
  // Header
  header: {
    EN: {
      services: "Services",
      projects: "Projects",
      team: "Team",
      contact: "Contact",
      cta: "Book a Call",
    },
    ES: {
      services: "Servicios",
      projects: "Proyectos",
      team: "Equipo",
      contact: "Contacto",
      cta: "Agendar Llamada",
    },
  },

  // Hero
  hero: {
    EN: {
      headline1: "Turn Your Data",
      headline2: "Into Decisions",
      description: "We build internal tools, dashboards and AI agents to automate workflows and unlock insights from company data. Specialized in Databricks, Azure & AI agents.",
      cta1: "Book a Call",
      cta2: "View Projects",
      trusted: "Trusted by innovative companies",
    },
    ES: {
      headline1: "Convierte Tus Datos",
      headline2: "En Decisiones",
      description: "Construimos herramientas internas, dashboards y agentes de IA para automatizar flujos de trabajo y desbloquear insights de los datos de las empresas. Especializados en Databricks, Azure y agentes de IA.",
      cta1: "Agendar Llamada",
      cta2: "Ver Proyectos",
      trusted: "Empresas innovadoras confían en nosotros",
    },
  },

  // Services
  services: {
    EN: {
      title: "Our Services",
      subtitle: "Comprehensive solutions to help your business leverage data and technology effectively.",
      getStarted: "Get Started",
      learnMore: "Learn More",
    },
    ES: {
      title: "Nuestros Servicios",
      subtitle: "Soluciones integrales para ayudar a tu negocio a aprovechar los datos y la tecnología de manera efectiva.",
      getStarted: "Comenzar",
      learnMore: "Saber más",
    },
  },

  // Projects
  projects: {
    EN: {
      title: "Selected Work",
      subtitle: "Some projects and experiments we've enjoyed building.",
      viewProject: "View Project",
      viewLanding: "View Landing",
      liveDemo: "Live Demo",
      viewAll: "View All Projects",
    },
    ES: {
      title: "Trabajos Seleccionados",
      subtitle: "Algunos proyectos y experimentos que nos ha gustado construir.",
      viewProject: "Ver Proyecto",
      viewLanding: "Ver Landing",
      liveDemo: "Demo en Vivo",
      viewAll: "Ver Todos los Proyectos",
    },
  },

  // Skills
  skills: {
    EN: {
      title: "Technologies We Use",
      subtitle: "We are passionate about using cutting-edge technologies. These are the tools we work with every day.",
    },
    ES: {
      title: "Tecnologías que Usamos",
      subtitle: "Nos apasiona usar tecnologías de vanguardia. Estas son las herramientas con las que trabajamos todos los días.",
    },
  },

  // Team
  team: {
    EN: {
      title: "Meet the Team",
      subtitle: "The people behind Anthana, bringing together expertise in data, development, and business.",
    },
    ES: {
      title: "Conoce al Equipo",
      subtitle: "Las personas detrás de Anthana, reuniendo experiencia en datos, desarrollo y negocios.",
    },
  },

  // Contact
  contact: {
    EN: {
      title: "Let's Work Together",
      subtitle: "Anthana works with companies that have lots of data and want guidance plus implementation. We're not a self-serve SaaS—we provide hands-on expertise, custom solutions, and ongoing support.",
      cta: "Book a Call",
      emailPrefix: "Or email us at",
      features: [
        "Custom data solutions",
        "Hands-on implementation",
        "Ongoing support",
      ],
      form: {
        company: "Company Name",
        phone: "Phone",
        email: "Email",
        submit: "Send Request",
        success: "Thank you! We'll contact you soon.",
        placeholders: {
          company: "Acme Inc.",
          phone: "+52 555 123 4567",
          email: "contacto@empresa.com",
        },
      },
    },
    ES: {
      title: "Trabajemos Juntos",
      subtitle: "Anthana trabaja con empresas que tienen muchos datos y quieren orientación e implementación. No somos un SaaS de autoservicio—proporcionamos experiencia práctica, soluciones personalizadas y soporte continuo.",
      cta: "Agendar Llamada",
      emailPrefix: "O escríbenos a",
      features: [
        "Soluciones de datos personalizadas",
        "Implementación práctica",
        "Soporte continuo",
      ],
      form: {
        company: "Nombre de la Empresa",
        phone: "Teléfono",
        email: "Correo",
        submit: "Enviar Solicitud",
        success: "¡Gracias! Te contactaremos pronto.",
        placeholders: {
          company: "Acme Inc.",
          phone: "+52 555 123 4567",
          email: "contacto@empresa.com",
        },
      },
    },
  },

  // Selected Work Page
  selectedWork: {
    EN: {
      title: "Selected Work",
      subtitle: "A curated collection of projects we're proud of",
      scrollToExplore: "Scroll to explore",
      viewProject: "View Project",
      viewLanding: "View Landing",
      liveDemo: "Live Demo",
      techUsed: "Built with",
      backToHome: "Back to Home",
      projectOf: "of",
      nextProject: "Next",
      prevProject: "Previous",
      ctaTitle: "Let's Build Something Amazing",
      ctaSubtitle: "Ready to bring your vision to life?",
      ctaButton: "Get in Touch",
    },
    ES: {
      title: "Trabajos Seleccionados",
      subtitle: "Una colección curada de proyectos de los que estamos orgullosos",
      scrollToExplore: "Desliza para explorar",
      viewProject: "Ver Proyecto",
      viewLanding: "Ver Landing",
      liveDemo: "Demo en Vivo",
      techUsed: "Construido con",
      backToHome: "Volver al Inicio",
      projectOf: "de",
      nextProject: "Siguiente",
      prevProject: "Anterior",
      ctaTitle: "Construyamos Algo Increíble",
      ctaSubtitle: "¿Listo para dar vida a tu visión?",
      ctaButton: "Contáctanos",
    },
  },

  // Footer
  footer: {
    EN: {
      tagline: "Helping companies turn their data into decisions.",
      navigation: {
        title: "Navigation",
        links: [
          { label: "Services", href: "#services" },
          { label: "Projects", href: "#projects" },
          { label: "Team", href: "#team" },
          { label: "Contact", href: "#contact" },
        ],
      },
      products: {
        title: "Products",
        links: [
          { label: "Portal", href: "/login" },
        ],
      },
      legal: {
        title: "Legal",
        links: [
          { label: "Privacy Policy", href: "#" },
          { label: "Terms of Service", href: "#" },
        ],
      },
      copyright: `© ${company.year} ${company.name}. All rights reserved.`,
      builtWith: {
        prefix: "Built with",
        tech1: "Next.js",
        separator: "&",
        tech2: "Tailwind CSS",
      },
    },
    ES: {
      tagline: "Ayudando a empresas a convertir sus datos en decisiones.",
      navigation: {
        title: "Navegación",
        links: [
          { label: "Servicios", href: "#services" },
          { label: "Proyectos", href: "#projects" },
          { label: "Equipo", href: "#team" },
          { label: "Contacto", href: "#contact" },
        ],
      },
      products: {
        title: "Productos",
        links: [
          { label: "Portal", href: "/login" },
        ],
      },
      legal: {
        title: "Legal",
        links: [
          { label: "Política de Privacidad", href: "#" },
          { label: "Términos de Servicio", href: "#" },
        ],
      },
      copyright: `© ${company.year} ${company.name}. Todos los derechos reservados.`,
      builtWith: {
        prefix: "Hecho con",
        tech1: "Next.js",
        separator: "y",
        tech2: "Tailwind CSS",
      },
    },
  },
} as const;

/**
 * Helper to get translations for a specific section
 * Note: Using 'any' return type to work around TypeScript's strict inference with 'as const'
 */
export function getTranslations<K extends keyof typeof translations>(
  section: K,
  language: Language
): any {
  return translations[section][language];
}


