"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ThemeId = "paper" | "dark" | "meadow";

export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "paper", label: "Paper", swatch: "#f3efe6" },
  { id: "dark", label: "Dark", swatch: "#1c1a16" },
  { id: "meadow", label: "Meadow", swatch: "#eef2e4" },
];

export const THEME_STORAGE_KEY = "helm-theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((t) => t.id === value);
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

  const setTheme = (next: ThemeId) => {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
