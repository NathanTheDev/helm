"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, CUSTOM_THEME_VARS, FONTS, useTheme, type FontId } from "@/lib/theme-context";

const FONT_PREVIEW_VAR: Record<FontId, string> = {
  classic: "var(--font-fraunces)",
  modern: "var(--font-inter)",
  mono: "var(--font-plex-mono)",
};

function Swatch({
  color,
  secondary,
  size = "h-6 w-6",
}: {
  color: string;
  secondary?: string;
  size?: string;
}) {
  return (
    <span className={`relative ${size} shrink-0 overflow-hidden rounded-full border border-line/70`} style={{ backgroundColor: color }}>
      {secondary && (
        <span
          className="absolute bottom-0 right-0 h-1/2 w-1/2 rounded-full border border-line/70"
          style={{ backgroundColor: secondary }}
        />
      )}
    </span>
  );
}

function OptionCard({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-control border px-2.5 py-2 text-left transition-colors ${
        active ? "border-clay bg-clay-soft/30" : "border-line hover:border-clay/50"
      }`}
    >
      {children}
    </button>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme, customTheme, setCustomColor, font, setFont } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const currentSwatch =
    theme === "custom" ? customTheme.paper : (THEMES.find((t) => t.id === theme) ?? THEMES[0]).swatch;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Appearance"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-line transition-colors hover:border-clay"
      >
        <span
          className="h-3.5 w-3.5 rounded-full border border-line/70"
          style={{ backgroundColor: currentSwatch }}
          aria-hidden
          // currentSwatch depends on ThemeProvider's lazily-read `theme`,
          // which is intentionally read from the DOM (matching the blocking
          // pre-paint script) rather than always the SSR default - same
          // tradeoff already made for <html suppressHydrationWarning> in
          // layout.tsx. The mismatch this causes is expected and correct
          // (client's value is the real one), not a bug to patch around.
          suppressHydrationWarning
        />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-card border border-line bg-surface p-4 shadow-lg">
          <p className="font-display text-base text-ink">Appearance</p>

          <p className="mt-3.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">Theme</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {THEMES.map((t) => (
              <OptionCard key={t.id} active={theme === t.id} onClick={() => setTheme(t.id)}>
                <Swatch color={t.swatch} />
                <span className="flex-1 text-xs font-medium text-ink">{t.label}</span>
                {theme === t.id && <span className="text-clay" aria-hidden>✓</span>}
              </OptionCard>
            ))}
            <OptionCard active={theme === "custom"} onClick={() => setTheme("custom")}>
              <Swatch color={customTheme.paper} secondary={customTheme.clay} />
              <span className="flex-1 text-xs font-medium text-ink">Custom</span>
              {theme === "custom" && <span className="text-clay" aria-hidden>✓</span>}
            </OptionCard>
          </div>

          {theme === "custom" && (
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-control bg-paper/60 p-3">
              {CUSTOM_THEME_VARS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2">
                  <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-line/70">
                    <span className="absolute inset-0" style={{ backgroundColor: customTheme[key] }} aria-hidden />
                    <input
                      type="color"
                      value={customTheme[key]}
                      onChange={(e) => setCustomColor(key, e.target.value)}
                      aria-label={label}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">{label}</span>
                </label>
              ))}
            </div>
          )}

          <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-ink-muted">Font</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {FONTS.map((f) => (
              <OptionCard key={f.id} active={font === f.id} onClick={() => setFont(f.id)}>
                <span className="flex w-full flex-col items-center gap-1">
                  <span className="text-lg leading-none text-ink" style={{ fontFamily: FONT_PREVIEW_VAR[f.id] }}>
                    Aa
                  </span>
                  <span className="text-[10px] text-ink-muted">{f.label}</span>
                </span>
              </OptionCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
