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
          elevated: "var(--surface-elevated)",
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

        // Semantic colors
        info: {
          DEFAULT: "var(--info)",
          muted: "var(--info-muted)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          muted: "var(--warning-muted)",
        },
        success: {
          DEFAULT: "var(--success)",
          muted: "var(--success-muted)",
        },
        error: {
          DEFAULT: "var(--error)",
          muted: "var(--error-muted)",
        },

        // Legacy support
        brand: {
          DEFAULT: "var(--foreground)",
        },
        "surface-2": "var(--surface-2)",
        "surface-elevated": "var(--surface-elevated)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        subtle: "0 1px 3px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 0.4)), 0 1px 2px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 0.3))",
        card: "0 2px 8px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 0.5)), 0 1px 3px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 0.3))",
        "card-hover": "0 4px 16px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 0.7)), 0 2px 6px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 0.4))",
        elevated: "0 8px 24px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 0.8)), 0 4px 8px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 0.5))",
        "focus-green": "0 0 0 3px var(--focus-ring-alpha)",
      },
      fontSize: {
        'label': ['13px', { lineHeight: '1.4' }],
        'body': ['15px', { lineHeight: '1.7' }],
      },
      letterSpacing: {
        widest: '0.1em',
      },
      animation: {
        blink: "blink 1s step-end infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        marquee: "marquee 30s linear infinite",
        "marquee-reverse": "marquee-reverse 30s linear infinite",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
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
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0%)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
