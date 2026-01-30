// =============================================================================
// Design Tokens & Constants
// =============================================================================

/**
 * Brand colors
 */
export const colors = {
  primary: "#FF3621",
  primaryLight: "#FF6B35",
  primaryHover: "rgba(255, 54, 33, 0.9)",
  primaryBg: "rgba(255, 54, 33, 0.1)",
  primaryBorder: "rgba(255, 54, 33, 0.2)",
} as const;

/**
 * Common animation variants for Framer Motion
 */
export const animations = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  },
  fadeInUpDelayed: (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  }),
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5 },
  },
  staggerChildren: {
    animate: { transition: { staggerChildren: 0.1 } },
  },
} as const;

/**
 * Viewport settings for scroll-triggered animations
 */
export const viewport = {
  once: true,
} as const;

/**
 * Common Tailwind class combinations
 */
export const styles = {
  // Container
  container: "max-w-7xl mx-auto px-6 lg:px-8",
  
  // Section spacing
  section: "py-24 lg:py-32",
  sectionWithBg: "py-24 lg:py-32 bg-gray-50",
  
  // Typography
  sectionTitle: "text-4xl lg:text-5xl font-bold text-gray-900 mb-4",
  sectionSubtitle: "text-lg text-gray-600 max-w-2xl mx-auto",
  
  // Buttons
  buttonPrimary: "inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-[#FF3621] rounded-full hover:bg-[#FF3621]/90 transition-all duration-300 hover:-translate-y-1",
  buttonSecondary: "inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-full hover:border-[#FF3621] hover:text-[#FF3621] transition-all duration-300",
  buttonPrimaryLarge: "inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-[#FF3621] rounded-full hover:bg-[#FF3621]/90 transition-all duration-300 hover:-translate-y-1",
  
  // Cards
  card: "bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300",
  
  // Tags/Badges
  tag: "px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full",
  tagPrimary: "px-4 py-2 rounded-full bg-[#FF3621]/10 border border-[#FF3621]/20",
  
  // Form inputs
  input: "w-full pl-11 pr-4 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#FF3621] focus:ring-2 focus:ring-[#FF3621]/10 transition-all placeholder:text-gray-400",
  
  // Social icons
  socialIcon: "w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-[#FF3621] hover:bg-[#FF3621]/10 transition-colors",
} as const;

/**
 * Company information
 */
export const company = {
  name: "anthana.agency",
  email: "anthanasupp@gmail.com",
  year: new Date().getFullYear(),
} as const;

/**
 * External links
 */
export const links = {
  databricksPage: "/db-anthana",
  portal: "/login",
} as const;


