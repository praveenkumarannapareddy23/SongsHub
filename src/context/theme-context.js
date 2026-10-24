"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem("songhub_theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      // Check system preference
      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      setTheme(prefersLight ? "light" : "dark");
    }
    setMounted(true);
  }, []);

  // Apply theme to <html> element and persist
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("songhub_theme", theme);
  }, [theme, mounted]);

  // Listen for system theme changes (only when no manual preference stored)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e) => {
      const stored = localStorage.getItem("songhub_theme");
      if (!stored) {
        setTheme(e.matches ? "light" : "dark");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    if (typeof document !== "undefined" && document.startViewTransition) {
      document.startViewTransition(() => {
        setTheme(nextTheme);
      });
    } else if (typeof document !== "undefined") {
      document.documentElement.classList.add("theme-transition");
      setTheme(nextTheme);
      setTimeout(() => {
        document.documentElement.classList.remove("theme-transition");
      }, 300);
    } else {
      setTheme(nextTheme);
    }
  }, [theme]);

  // Provide a default theme during SSR to prevent useTheme() errors
  const contextValue = mounted ? { theme, toggleTheme } : { theme: "dark", toggleTheme: () => {} };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
