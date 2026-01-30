// =============================================================================
// Selected Work Page - Animation Variants
// =============================================================================

import { Variants } from "framer-motion";

/**
 * Animation variants for the Selected Work page
 */
export const selectedWorkAnimations = {
  // Hero Section Animations
  heroTitle: {
    initial: { opacity: 0, scale: 1.1, y: 30 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },

  heroSubtitle: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.3,
        ease: "easeOut",
      },
    },
  },

  scrollIndicator: {
    animate: {
      y: [0, 12, 0] as number[],
      transition: {
        duration: 1.8,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  },

  // Text Reveal Animation (character by character)
  textReveal: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.02,
          delayChildren: 0.1,
        },
      },
    } as Variants,
    char: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.3,
          ease: "easeOut",
        },
      },
    } as Variants,
  },

  // Project Section Animations
  projectImage: {
    initial: { opacity: 0, scale: 1.05 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.4,
      },
    },
  },

  projectContent: {
    initial: { opacity: 0, x: 40 },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        delay: 0.2,
        ease: "easeOut",
      },
    },
  },

  projectNumber: {
    initial: { opacity: 0, y: -10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  },

  // Tech Badges Animation
  techBadges: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.3,
        },
      },
    } as Variants,
    badge: {
      hidden: { opacity: 0, scale: 0.8, y: 10 },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          duration: 0.3,
          ease: "easeOut",
        },
      },
    } as Variants,
  },

  // Navigation Dots
  dot: {
    active: {
      scale: 1.4,
      backgroundColor: "#FF3621",
      transition: { duration: 0.3 },
    },
    inactive: {
      scale: 1,
      backgroundColor: "#9CA3AF",
      transition: { duration: 0.3 },
    },
  },

  // CTA Section
  ctaSection: {
    initial: { opacity: 0, y: 40 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  },

  // Fade variants for sections
  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  },

  // Stagger container for lists
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  } as Variants,

  staggerItem: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  } as Variants,
} as const;

/**
 * Viewport settings for scroll-triggered animations
 */
export const selectedWorkViewport = {
  once: true,
  margin: "-100px",
};

/**
 * Spring configuration for smooth animations
 */
export const springConfig = {
  stiffness: 100,
  damping: 30,
  restDelta: 0.001,
};
