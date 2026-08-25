"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_SPACE_NAME, readSpaceName } from "@/lib/space-name";

// Auth pages (login/signup/forgot-password/reset-password) don't render the
// app's NavBar - see AUTH_PATHS in lib/auth-paths.ts - so this is their
// entire header/chrome: just a static wordmark, no nav links, no account
// menu, nothing clickable at all.
export function AuthShell({ children }: { children: ReactNode }) {
  // Same SSR-safe pattern as NavBar: start at the default so server and
  // first client render match, then swap to the stored name post-mount.
  const [spaceName, setSpaceName] = useState(DEFAULT_SPACE_NAME);

  useEffect(() => {
    setSpaceName(readSpaceName());
  }, []);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/4 left-1/2 h-[40rem] w-[40rem] -translate-x-[70%]"
        style={{
          background: "radial-gradient(closest-side, var(--clay) 0%, transparent 70%)",
          opacity: 0.08,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/4 right-1/2 h-[36rem] w-[36rem] translate-x-[70%]"
        style={{
          background: "radial-gradient(closest-side, var(--sage) 0%, transparent 70%)",
          opacity: 0.08,
        }}
      />

      <div className="relative mb-8 flex items-center gap-2 font-display text-lg tracking-tight text-ink">
        <span className="inline-block h-2 w-2 rounded-full bg-clay" aria-hidden />
        {spaceName}
      </div>

      <div className="relative w-full max-w-sm rounded-card border border-line bg-surface p-8 shadow-lg sm:p-9">
        {children}
      </div>
    </main>
  );
}
