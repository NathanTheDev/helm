export type ThemeId = "paper" | "dark" | "meadow" | "custom";

export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "paper", label: "Paper", swatch: "#f3efe6" },
  { id: "dark", label: "Dark", swatch: "#1c1a16" },
  { id: "meadow", label: "Meadow", swatch: "#eef2e4" },
];

export const THEME_STORAGE_KEY = "helm-theme";

// User-created "Custom" theme: a handful of the CSS vars from globals.css,
// stored as an inline-style override on <html> so it works without
// shipping a 4th baked-in [data-theme] block.
export type CustomThemeVar = "paper" | "surface" | "ink" | "clay" | "sage";

export const CUSTOM_THEME_VARS: { key: CustomThemeVar; label: string }[] = [
  { key: "paper", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "ink", label: "Text" },
  { key: "clay", label: "Accent" },
  { key: "sage", label: "Accent 2" },
];

export type CustomTheme = Record<CustomThemeVar, string>;

export const DEFAULT_CUSTOM_THEME: CustomTheme = {
  paper: "#f3efe6",
  surface: "#fdfbf6",
  ink: "#26221c",
  clay: "#c9633e",
  sage: "#6f7d5c",
};

export const CUSTOM_THEME_STORAGE_KEY = "helm-theme-custom";
