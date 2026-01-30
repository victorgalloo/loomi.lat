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
        // Loomi mint palette
        mint: {
          50: "#f2fcf9",
          100: "#e0f8f1",
          200: "#bef0e2",
          300: "#8ee2ce",
          400: "#57cca7",
          500: "#34b38d",
          600: "#259174",
          700: "#20745f",
        },
        // Databricks-inspired palette
        background: "var(--background)",
        foreground: "var(--foreground)",
        
        // Primary - Syntra Orange
        primary: {
          DEFAULT: "#FF9F32",
          foreground: "#ffffff",
          50: "#FFF8F0",
          100: "#FFEED9",
          200: "#FFDDB3",
          300: "#FFCC8C",
          400: "#FFBB66",
          500: "#FF9F32",
          600: "#E68E2B",
          700: "#CC7D26",
          800: "#A3641E",
          900: "#7A4B17",
        },
        
        // Surface colors for cards/sections
        surface: {
          DEFAULT: "var(--surface)",
          light: "#F8F9FA",
          dark: "#1A1A24",
          darker: "#12121A",
        },
        
        // Base background
        base: {
          DEFAULT: "#f7f5f2",
          light: "#FFFFFF",
          foreground: "#1f1f1f",
          "foreground-light": "#1A1A24",
        },
        
        // Card styling
        card: {
          DEFAULT: "#1A1A24",
          light: "#FFFFFF",
          foreground: "#FFFFFF",
          border: "#2A2A36",
        },
        
        // Accent for gradients
        accent: {
          DEFAULT: "#FF6B35",
          foreground: "#FFFFFF",
          orange: "#FF6B35",
          red: "#FF3621",
        },
        
        // Muted text
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "#9CA3AF",
          light: "#374151",
        },
        
        // Border colors
        border: {
          DEFAULT: "var(--border)",
          light: "#E5E7EB",
        },
        
        // Legacy support for Syntra
        "muted-foreground": "#6b7280",
        "base-foreground": "#1f1f1f",
        "primary-foreground": "#ffffff",

        // Loomi neon colors
        neon: {
          green: '#00FF66',
          yellow: '#FFD93D',
          red: '#FF6B6B',
          cyan: '#4ECDC4',
          purple: '#A855F7',
        },
        "surface-2": 'var(--surface-2)',
        gray: {
          950: '#0A0A0A',
          900: '#111111',
          850: '#161616',
          800: '#1C1C1C',
          700: '#2A2A2A',
          600: '#3D3D3D',
          500: '#5C5C5C',
          400: '#8A8A8A',
          300: '#B3B3B3',
          200: '#D4D4D4',
          100: '#EBEBEB',
          50: '#FAFAFA',
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 18px 45px -25px rgba(15, 23, 42, 0.25)",
        glow: "0 0 40px rgba(255, 54, 33, 0.15)",
        "glow-lg": "0 0 60px rgba(255, 54, 33, 0.25)",
        card: "0 4px 24px rgba(0, 0, 0, 0.12)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.2)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #FF3621 0%, #FF6B35 100%)",
        "gradient-dark": "linear-gradient(180deg, #0D0D12 0%, #1A1A24 100%)",
        "gradient-glow": "radial-gradient(ellipse at center, rgba(255, 54, 33, 0.15) 0%, transparent 70%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-up": "fadeUp 0.6s ease-out",
        "slide-in": "slideIn 0.4s ease-out",
        marquee: "marquee 30s linear infinite",
        "marquee-slow": "marquee 45s linear infinite",
        glow: "glow 3s ease-in-out infinite",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        // Loomi animations
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'gradient': 'gradient-shift 8s ease infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "border-beam": {
          "100%": { "offset-distance": "100%" },
        },
        // Loomi keyframes
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
