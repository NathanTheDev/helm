"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
import { FONTS, FONT_STORAGE_KEY, DEFAULT_FONT, type FontId } from "@/lib/font-constants";

export { THEMES, THEME_STORAGE_KEY, CUSTOM_THEME_VARS, DEFAULT_CUSTOM_THEME, FONTS };
export type { ThemeId, CustomTheme, CustomThemeVar, FontId };

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  customTheme: CustomTheme;
  setCustomColor: (key: CustomThemeVar, value: string) => void;
  font: FontId;
  setFont: (font: FontId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeId(value: string | null): value is ThemeId {
  return value === "custom" || THEMES.some((t) => t.id === value);
}

function isFontId(value: string | null): value is FontId {
  return FONTS.some((f) => f.id === value);
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

  // Font, unlike theme, has no color/attribute readout rendered as part of
  // the initial client tree (no swatch depends on it) - reading it lazily
  // would only save one render pass, so it's read in an effect instead to
  // keep this file's one lazy-read exception (theme) from spreading.
  const [font, setFontState] = useState<FontId>(DEFAULT_FONT);

  useEffect(() => {
    const stored = localStorage.getItem(FONT_STORAGE_KEY);
    setFontState(isFontId(stored) ? stored : DEFAULT_FONT);
  }, []);

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
  // changed var immediately. Uses the functional updater form - React 18
  // batches same-tick setState calls, so two swatches edited back-to-back
  // (e.g. programmatically) would otherwise both read the same stale
  // `customTheme` closure and the second call's spread would clobber the
  // first's change.
  const setCustomColor = (key: CustomThemeVar, value: string) => {
    setCustomThemeState((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    document.documentElement.style.setProperty(`--${key}`, value);
    if (theme !== "custom") {
      setThemeState("custom");
      localStorage.setItem(THEME_STORAGE_KEY, "custom");
      document.documentElement.setAttribute("data-theme", "custom");
    }
  };

  const setFont = (next: FontId) => {
    setFontState(next);
    localStorage.setItem(FONT_STORAGE_KEY, next);
    document.documentElement.setAttribute("data-font", next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customTheme, setCustomColor, font, setFont }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
