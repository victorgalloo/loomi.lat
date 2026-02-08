import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core colors - use CSS variables for theme support
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        border: {
          DEFAULT: "var(--border)",
          hover: "var(--border-hover)",
        },

        // Terminal window colors - fixed across themes
        terminal: {
          red: "var(--terminal-red)",
          yellow: "var(--terminal-yellow)",
          green: "var(--terminal-green)",
        },

        // Theme-aware accent colors for text readability
        accent: {
          green: "var(--accent-green)",
        },

        // Legacy support
        brand: {
          DEFAULT: "var(--foreground)",
        },
        "surface-2": "var(--surface-2)",
      },
      fontFamily: {
        sans: ["Lexend", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0, 0, 0, 0.1)",
        card: "0 2px 8px rgba(0, 0, 0, 0.15)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.2)",
        elevated: "0 8px 24px rgba(0, 0, 0, 0.25)",
      },
      fontSize: {
        'label': ['13px', { lineHeight: '1.4' }],
        'body': ['15px', { lineHeight: '1.7' }],
      },
      animation: {
        blink: "blink 1s step-end infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
