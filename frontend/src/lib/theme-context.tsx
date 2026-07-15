"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  THEMES,
  THEME_STORAGE_KEY,
  CUSTOM_THEME_STORAGE_KEY,
  CUSTOM_THEME_VARS,
  DEFAULT_CUSTOM_THEME,
  type ThemeId,
  type CustomTheme,
  type CustomThemeVar,
} from "@/lib/theme-constants";

export { THEMES, THEME_STORAGE_KEY, CUSTOM_THEME_VARS, DEFAULT_CUSTOM_THEME };
export type { ThemeId, CustomTheme, CustomThemeVar };

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  customTheme: CustomTheme;
  setCustomColor: (key: CustomThemeVar, value: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeId(value: string | null): value is ThemeId {
  return value === "custom" || THEMES.some((t) => t.id === value);
}

function readCustomTheme(): CustomTheme {
  if (typeof window === "undefined") return DEFAULT_CUSTOM_THEME;
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    return raw ? { ...DEFAULT_CUSTOM_THEME, ...JSON.parse(raw) } : DEFAULT_CUSTOM_THEME;
  } catch {
    return DEFAULT_CUSTOM_THEME;
  }
}

function applyCustomTheme(colors: CustomTheme) {
  for (const { key } of CUSTOM_THEME_VARS) {
    document.documentElement.style.setProperty(`--${key}`, colors[key]);
  }
}

function clearCustomTheme() {
  for (const { key } of CUSTOM_THEME_VARS) {
    document.documentElement.style.removeProperty(`--${key}`);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazy-read (not an effect) so this matches, on the very first client
  // render, whatever the blocking script in layout.tsx already applied to
  // <html> pre-paint - no flash, no extra render pass.
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof document === "undefined") return "paper";
    const current = document.documentElement.getAttribute("data-theme");
    return isThemeId(current) ? current : "paper";
  });
  const [customTheme, setCustomThemeState] = useState<CustomTheme>(() => readCustomTheme());

  const setTheme = (next: ThemeId) => {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
    if (next === "custom") {
      applyCustomTheme(customTheme);
    } else {
      clearCustomTheme();
    }
  };

  // Editing a swatch always activates the custom theme, applying just the
  // changed var immediately (not the whole `customTheme` snapshot, which
  // would still be stale from before this update lands in state).
  const setCustomColor = (key: CustomThemeVar, value: string) => {
    const next = { ...customTheme, [key]: value };
    setCustomThemeState(next);
    localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(next));
    document.documentElement.style.setProperty(`--${key}`, value);
    if (theme !== "custom") {
      setThemeState("custom");
      localStorage.setItem(THEME_STORAGE_KEY, "custom");
      document.documentElement.setAttribute("data-theme", "custom");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customTheme, setCustomColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
