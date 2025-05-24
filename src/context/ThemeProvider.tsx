
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from localStorage or default to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'system'; // Default for server-side rendering
    }
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  // Stores the actual theme being applied (light or dark), resolving 'system'
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Effect to update resolvedTheme and apply class to HTML element when theme changes
  useEffect(() => {
    let currentTheme: ResolvedTheme;
    const root = window.document.documentElement;

    if (theme === 'system') {
      currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      currentTheme = theme;
    }

    setResolvedTheme(currentTheme);
    root.classList.remove('light', 'dark');
    root.classList.add(currentTheme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Effect to listen for system theme changes if 'system' is selected
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const newResolvedTheme = mediaQuery.matches ? 'dark' : 'light';
      setResolvedTheme(newResolvedTheme);
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newResolvedTheme);
    };

    // Set initial state based on system preference
    handleChange();

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]); // Rerun if theme changes to or from 'system'

  const contextValue = {
    theme,
    setTheme: setThemeState,
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider value={contextValue}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
