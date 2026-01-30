'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set the theme immediately on mount
    document.documentElement.setAttribute('data-theme', defaultTheme);

    const stored = localStorage.getItem('loomi-theme') as Theme | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, [defaultTheme]);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('loomi-theme', theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return { theme: 'light' as const, toggleTheme: () => {} };
  }
  return context;
}
