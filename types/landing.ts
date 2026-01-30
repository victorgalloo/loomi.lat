// =============================================================================
// Landing Page Types
// =============================================================================

/**
 * Supported languages for the landing page
 */
export type Language = "EN" | "ES";

/**
 * Props interface for components that need language support
 */
export interface WithLanguage {
  language: Language;
}

/**
 * Bilingual text content
 */
export type BilingualText = Record<Language, string>;

/**
 * Bilingual array content
 */
export type BilingualArray<T> = Record<Language, T[]>;

/**
 * Navigation link structure
 */
export interface NavLink {
  href: string;
  label: string;
}

/**
 * Social media link
 */
export interface SocialLink {
  platform: "linkedin" | "github" | "twitter";
  url: string;
}

/**
 * Team member experience entry
 */
export interface Experience {
  title: string;
  company: string;
  period: string;
}

/**
 * Team member data
 */
export interface TeamMember {
  name: string;
  image: string;
  role: BilingualText;
  experience: Experience[];
  social: {
    linkedin?: string;
  };
}

/**
 * Technology/Skill item
 */
export interface Skill {
  name: string;
  iconSrc: string;
}

/**
 * Project data
 */
export interface Project {
  id: string;
  name: string | BilingualText;
  tagline: BilingualText;
  description: BilingualText;
  tech: string[];
  imageSrc: string;
  images: string[];
  hasLandingPage?: boolean;
  landingUrl?: string;
  liveUrl?: string;
  videoSrc?: string;
  backgroundSrc?: string;
  // Use animated hero background (like Loomi)
  useHeroAnimation?: boolean;
  // Custom background with logo
  customBackground?: {
    logoSrc: string;
    bgColor: string;
    accentColor: string;
  };
}

/**
 * Service feature
 */
export interface ServiceFeature {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

/**
 * Service tab data
 */
export interface ServiceTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: ServiceFeature[];
}


