export type ThemeId = "paper" | "dark" | "meadow";

export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "paper", label: "Paper", swatch: "#f3efe6" },
  { id: "dark", label: "Dark", swatch: "#1c1a16" },
  { id: "meadow", label: "Meadow", swatch: "#eef2e4" },
];

export const THEME_STORAGE_KEY = "helm-theme";
