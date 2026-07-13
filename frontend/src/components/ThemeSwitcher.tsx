"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, useTheme } from "@/lib/theme-context";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
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

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-line transition-colors hover:border-clay"
      >
        <span
          className="h-3.5 w-3.5 rounded-full border border-line/70"
          style={{ backgroundColor: current.swatch }}
          aria-hidden
        />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-36 rounded-card border border-line bg-surface p-1.5 shadow-md">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm transition-colors hover:bg-clay-soft/40 ${
                theme === t.id ? "text-ink" : "text-ink-muted"
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-line/70"
                style={{ backgroundColor: t.swatch }}
                aria-hidden
              />
              <span className="flex-1">{t.label}</span>
              {theme === t.id && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
