"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Group, Panel, Separator, useDefaultLayout, usePanelRef, type LayoutStorage } from "react-resizable-panels";
import { AUTH_PATHS } from "@/lib/auth-paths";
import AuthGate from "@/components/auth/AuthGate";
import { Sidebar } from "@/components/Sidebar";
import { MobileNavBar } from "@/components/MobileNavBar";

// useDefaultLayout falls back to the bare `localStorage` global whenever
// `storage` is omitted/undefined - that throws a ReferenceError during SSR
// (no `localStorage` global in Node). Always supplying this guarded wrapper
// (a stable module-level reference, not recreated per render) sidesteps it.
const ssrSafeLocalStorage: LayoutStorage = {
  getItem: (key) => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
  setItem: (key, value) => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
};

// Desktop nav is a resizable left sidebar (react-resizable-panels' Group/
// Panel/Separator - note the v4 API renamed these from the older
// PanelGroup/Panel/PanelResizeHandle names, checked against the installed
// package's .d.ts rather than assumed from memory) instead of a fixed top
// bar. Width is remembered per-browser via useDefaultLayout's localStorage
// persistence, keyed off the `id` below.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "helm-sidebar-layout",
    storage: ssrSafeLocalStorage,
  });
  const sidebarPanelRef = usePanelRef();

  // Panel's `className` only reaches a *nested* div, not the flex-item div
  // that actually reserves width in the Group - a plain `hidden sm:block`
  // class on the Panel doesn't stop it from occupying layout space on
  // mobile. Collapsing it for real (native collapse/expand, driven by a
  // resize-aware media query) is what actually gives that width back.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    const sync = (matches: boolean) => {
      if (matches) sidebarPanelRef.current?.expand();
      else sidebarPanelRef.current?.resize(0);
    };
    // Panel's imperative API isn't ready to act on the very first paint -
    // collapse()/resize() silently no-op if called before the Group has
    // completed its initial size measurement. A rAF defers past that.
    const raf = requestAnimationFrame(() => sync(mql.matches));
    const onChange = (e: MediaQueryListEvent) => sync(e.matches);
    mql.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(raf);
      mql.removeEventListener("change", onChange);
    };
  }, [sidebarPanelRef]);

  // Auth pages (login/signup/forgot-password/reset-password) render their
  // own minimal branded header (AuthShell) instead - no sidebar, no top bar.
  if (AUTH_PATHS.has(pathname)) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MobileNavBar />
      <Group
        orientation="horizontal"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        className="min-h-0 flex-1"
      >
        <Panel
          id="sidebar"
          panelRef={sidebarPanelRef}
          defaultSize={248}
          minSize={200}
          maxSize={420}
          collapsible
          collapsedSize={0}
          className="border-r border-line/70"
          suppressHydrationWarning
        >
          <Sidebar />
        </Panel>
        <Separator
          className="hidden w-1.5 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-clay-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay sm:block"
        >
          <span aria-hidden className="mx-auto block h-full w-px bg-line" />
        </Separator>
        <Panel id="content" className="flex min-h-0 flex-col" suppressHydrationWarning>
          <AuthGate>
            <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
          </AuthGate>
        </Panel>
      </Group>
    </div>
  );
}
