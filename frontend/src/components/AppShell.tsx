"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Group, Panel, Separator, useDefaultLayout, usePanelRef, type LayoutStorage } from "react-resizable-panels";
import { AUTH_PATHS } from "@/lib/auth-paths";
import AuthGate from "@/components/auth/AuthGate";
import { Sidebar } from "@/components/Sidebar";
import { MobileNavBar } from "@/components/MobileNavBar";
import { TabBar } from "@/components/TabBar";

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

// Sized to fit the nav links' icon+label content, not an arbitrary round
// number - see Sidebar.tsx's `links`.
const SIDEBAR_DEFAULT_WIDTH = 224;
// Icon-only rail width, driven by the Sidebar's own collapse toggle. Also
// doubles as the Panel's `minSize` (see below) - resize() targets below
// minSize silently snap to `collapsedSize` (0) instead of landing at the
// requested value, so minSize has to come down to exactly this number for
// resize(SIDEBAR_RAIL_WIDTH) to actually land there instead of snapping to
// fully hidden. (`collapsedSize` itself stays 0, not this - that's the
// mobile-hide target; see the mobile-sync effect below, which relies on
// literal 0 via a separate resize() call, not this rail state.)
const SIDEBAR_RAIL_WIDTH = 64;
const RAIL_STORAGE_KEY = "helm-sidebar-collapsed";

function readRailCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(RAIL_STORAGE_KEY) === "1";
}

function writeRailCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return;
  if (collapsed) window.localStorage.setItem(RAIL_STORAGE_KEY, "1");
  else window.localStorage.removeItem(RAIL_STORAGE_KEY);
}

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
  const [railCollapsed, setRailCollapsed] = useState(false);

  // Panel's `className` only reaches a *nested* div, not the flex-item div
  // that actually reserves width in the Group - a plain `hidden sm:block`
  // class on the Panel doesn't stop it from occupying layout space on
  // mobile. Collapsing it for real (native collapse/expand, driven by a
  // resize-aware media query) is what actually gives that width back.
  //
  // Also applies the persisted rail-collapse preference on desktop, folded
  // into this same effect/rAF rather than a second one - two effects each
  // scheduling their own requestAnimationFrame and calling the Panel's
  // imperative API independently raced in practice.
  useEffect(() => {
    const collapsed = readRailCollapsed();
    setRailCollapsed(collapsed);
    const mql = window.matchMedia("(min-width: 640px)");
    const sync = (isDesktop: boolean) => {
      if (!isDesktop) sidebarPanelRef.current?.resize(0);
      else if (collapsed) sidebarPanelRef.current?.resize(SIDEBAR_RAIL_WIDTH);
      else sidebarPanelRef.current?.expand();
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
    // `pathname` is a dependency (not just used for the early return below)
    // because the Panel/Sidebar tree only exists on non-auth routes: when
    // this effect first runs while on an auth route, `sidebarPanelRef` is
    // still null and the sync is a no-op. Re-running it on every pathname
    // change re-syncs once the Group/Panel actually mounts (e.g. right
    // after a login/signup redirect into the app on a mobile viewport).
  }, [sidebarPanelRef, pathname]);

  function toggleRailCollapsed() {
    const panel = sidebarPanelRef.current;
    if (!panel) return;
    const next = !railCollapsed;
    panel.resize(next ? SIDEBAR_RAIL_WIDTH : SIDEBAR_DEFAULT_WIDTH);
    setRailCollapsed(next);
    writeRailCollapsed(next);
  }

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
          defaultSize={SIDEBAR_DEFAULT_WIDTH}
          minSize={SIDEBAR_RAIL_WIDTH}
          maxSize={420}
          collapsible
          collapsedSize={0}
          className="border-r border-line/70"
          suppressHydrationWarning
        >
          <Sidebar collapsed={railCollapsed} onToggleCollapsed={toggleRailCollapsed} />
        </Panel>
        <Separator
          className="hidden w-1.5 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-clay-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay sm:block"
        >
          <span aria-hidden className="mx-auto block h-full w-px bg-line" />
        </Separator>
        <Panel id="content" className="flex min-h-0 flex-col" suppressHydrationWarning>
          <AuthGate>
            <TabBar />
            <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
          </AuthGate>
        </Panel>
      </Group>
    </div>
  );
}
