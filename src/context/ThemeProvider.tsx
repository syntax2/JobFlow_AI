
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize with a consistent default theme state for SSR and initial client render.
  // Client-specific theme will be applied after mount in useEffect.
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light'); // Default to light

  // Effect for initial theme load from localStorage and setting up system preference listener
  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    const storedTheme = (localStorage.getItem('theme') as Theme) || 'system';
    setThemeState(storedTheme); // Set the theme based on localStorage or default to 'system'

    // Determine and apply the correct resolved theme immediately after reading storedTheme
    // and setting up listeners if 'system' is chosen.
    let currentAppliedTheme: ResolvedTheme;
    if (storedTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      currentAppliedTheme = mediaQuery.matches ? 'dark' : 'light';
      
      // Listener for system theme changes
      const handleChange = () => {
        const newResolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newResolved);
      };
      mediaQuery.addEventListener('change', handleChange);
      
      // Clean up listener on unmount or if theme changes from 'system'
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      currentAppliedTheme = storedTheme;
    }

    setResolvedTheme(currentAppliedTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(currentAppliedTheme);

  }, []); // Empty dependency array ensures this runs once on mount to load initial theme

  // Effect to apply theme changes when `theme` state is updated by user interaction (setTheme)
  // and to persist the choice.
  useEffect(() => {
    // This effect handles changes to the `theme` state triggered by setTheme (e.g., user toggle).
    // The initial load and system preference listener are handled by the first useEffect.
    if (theme === 'system') {
        // If theme is set to 'system', the first useEffect's listener will handle updates.
        // We still need to ensure localStorage is updated if user explicitly chose 'system'.
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const currentSystemTheme = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(currentSystemTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(currentSystemTheme);
    } else {
        // If theme is 'light' or 'dark', apply it directly.
        setResolvedTheme(theme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]); // Runs whenever the `theme` state changes.


  const contextValue = {
    theme,
    setTheme: setThemeState, // This is the function to call to change the theme preference
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
