export type FontId = "classic" | "modern" | "mono";

export const FONTS: { id: FontId; label: string; description: string }[] = [
  { id: "classic", label: "Classic", description: "Serif headings, sans body" },
  { id: "modern", label: "Modern", description: "Sans throughout" },
  { id: "mono", label: "Mono", description: "Monospace throughout" },
];

export const FONT_STORAGE_KEY = "helm-font";
export const DEFAULT_FONT: FontId = "classic";
