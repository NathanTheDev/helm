"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  usePanelRef,
  type LayoutStorage,
  type PanelImperativeHandle,
} from "react-resizable-panels";
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

// A single requestAnimationFrame defer isn't always enough - neither for
// `sidebarPanelRef.current` to be attached (a hard page reload does far
// more hydration work than a live client-side toggle, and sometimes still
// hadn't attached the ref one frame later) nor, once it has, for the
// Panel's imperative API to be ready to act on it (its internal size
// measurement doesn't appear to be strictly synchronized to rAF timing).
// Either gap silently no-ops the resize call, leaving the actual panel
// width desynced from the `collapsed` React state driving Sidebar's
// icon-only rendering - icon-only content stranded in a full-width column.
// `cancelled` is checked at each retry so a stale loop from a previous
// effect run (e.g. the user toggled again, or navigated) can't stomp on
// a newer one after the fact; `framesLeft` bounds it so a panel that's
// never going to mount (this effect runs unconditionally, including on
// auth routes where there is no Panel at all) doesn't retry forever.
function resizeUntilApplied(
  getPanel: () => PanelImperativeHandle | null,
  target: number,
  cancelled: { current: boolean },
  framesLeft = 45,
) {
  if (cancelled.current || framesLeft <= 0) return;
  const panel = getPanel();
  if (!panel) {
    requestAnimationFrame(() => resizeUntilApplied(getPanel, target, cancelled, framesLeft - 1));
    return;
  }
  panel.resize(target);
  requestAnimationFrame(() => {
    if (!cancelled.current && Math.abs(panel.getSize().inPixels - target) > 1) {
      resizeUntilApplied(getPanel, target, cancelled, framesLeft - 1);
    }
  });
}

// Same panel-ref-not-attached-yet gap as above, but for `.expand()`, which
// has no target size to verify against.
function expandUntilApplied(getPanel: () => PanelImperativeHandle | null, cancelled: { current: boolean }, framesLeft = 45) {
  if (cancelled.current || framesLeft <= 0) return;
  const panel = getPanel();
  if (!panel) {
    requestAnimationFrame(() => expandUntilApplied(getPanel, cancelled, framesLeft - 1));
    return;
  }
  panel.expand();
}

// Desktop nav is a resizable left sidebar (react-resizable-panels' Group/
// Panel/Separator - note the v4 API renamed these from the older
// PanelGroup/Panel/PanelResizeHandle names, checked against the installed
// package's .d.ts rather than assumed from memory) instead of a fixed top
// bar. Width is remembered per-browser via useDefaultLayout's localStorage
// persistence, keyed off the `id` below.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // onlySaveAfterUserInteractions: true - without it, the rail-collapse and
  // mobile-hide paths' imperative resize() calls get persisted as the
  // "default" layout the same as a real drag would, which is never what's
  // wanted (that width is a transient UI state, not a preference). See the
  // `mounted`-keyed remount below for the *other*, more fundamental
  // defaultLayout bug this also happens to route around for the rail case.
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "helm-sidebar-layout",
    storage: ssrSafeLocalStorage,
    onlySaveAfterUserInteractions: true,
  });
  const sidebarPanelRef = usePanelRef();
  const [railCollapsed, setRailCollapsed] = useState(false);
  // Tracks the current matchMedia("(min-width: 640px)") result, kept in a
  // ref (not state) so the onResize handler below always reads the latest
  // value without needing to be re-subscribed on every breakpoint change.
  const isDesktopRef = useRef(true);

  // Traced into react-resizable-panels 4.12.3's own source
  // (dist/react-resizable-panels.js): `Group` wraps the `defaultLayout`
  // prop in a "latest ref" helper (`Re()`) before putting it in a layout
  // effect's dependency array. That ref's *identity* never changes across
  // renders (only its contents get mutated, one render late, via Re's own
  // effect), so the layout effect that actually applies `defaultLayout` to
  // the Panels' sizes only ever fires once, on the very first mount - it
  // never re-fires when a *later* render supplies a different
  // `defaultLayout` value. `useDefaultLayout` reads localStorage through
  // `useSyncExternalStore`, which - by design, matching the library's own
  // documented "slight layout shift" warning for percentage-based
  // defaultLayout - serves `null` during SSR and only resolves to the real
  // persisted value in a post-hydration correction render. That correction
  // arrives exactly one render too late for Group's broken effect to ever
  // see it: confirmed by direct instrumentation that `defaultLayout` is
  // already the correct persisted value by the time `<Group>` receives it
  // as a prop, yet the Panel renders at `defaultSize` regardless - for any
  // persisted width, not just the small rail-collapse one, including a
  // completely ordinary manual drag-resize.
  // Forcing a full remount via `key` once hydration has settled sidesteps
  // the bug entirely: `Re()`'s ref is *correctly* seeded on a fresh mount
  // (via plain `useRef(initialValue)`, no effect delay), so a Group that
  // mounts for the first time already holding the settled, correct
  // `defaultLayout` applies it right away. This fires exactly once per
  // hard page load (`mounted` only ever goes false -> true), not on every
  // client-side navigation between routes.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
    const cancelled = { current: false };
    const getPanel = () => sidebarPanelRef.current;
    const sync = (isDesktop: boolean) => {
      isDesktopRef.current = isDesktop;
      if (!isDesktop) resizeUntilApplied(getPanel, 0, cancelled);
      else if (collapsed) resizeUntilApplied(getPanel, SIDEBAR_RAIL_WIDTH, cancelled);
      else expandUntilApplied(getPanel, cancelled);
    };
    sync(mql.matches);
    const onChange = (e: MediaQueryListEvent) => sync(e.matches);
    mql.addEventListener("change", onChange);
    return () => {
      cancelled.current = true;
      mql.removeEventListener("change", onChange);
    };
    // `pathname` is a dependency (not just used for the early return below)
    // because the Panel/Sidebar tree only exists on non-auth routes: when
    // this effect first runs while on an auth route, `sidebarPanelRef` is
    // still null and the sync is a no-op. Re-running it on every pathname
    // change re-syncs once the Group/Panel actually mounts (e.g. right
    // after a login/signup redirect into the app on a mobile viewport).
    // `mounted` is a dependency because the Group below remounts (via its
    // `key`) once `mounted` flips true (see that comment) - without this,
    // the retry loop above keeps running against the *old*, by-then-
    // unmounted Panel instance (throwing once react-resizable-panels
    // notices its parent Group is gone) instead of the fresh one, and
    // never re-applies the collapsed/hidden width to the panel that
    // actually replaced it.
  }, [sidebarPanelRef, pathname, mounted]);

  function toggleRailCollapsed() {
    const panel = sidebarPanelRef.current;
    if (!panel) return;
    const next = !railCollapsed;
    resizeUntilApplied(() => panel, next ? SIDEBAR_RAIL_WIDTH : SIDEBAR_DEFAULT_WIDTH, { current: false });
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
        key={mounted ? "hydrated" : "ssr"}
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
          // `collapsible`/`collapsedSize=0` have to stay (the mobile-hide
          // path above needs a real resize(0) to work) - but that also lets
          // a manual desktop drag past minSize snap all the way to 0, which
          // is never wanted (the icon rail, not "gone", is the floor for a
          // drag). Bounce any such 0-width result on desktop back up to the
          // rail width and flip into rail-collapsed state, so a too-far
          // drag reads as "collapsed to icons" instead of "vanished". Mobile
          // hides via this exact same 0 target, but isDesktopRef is false
          // by the time that resize fires, so it's excluded here.
          onResize={(size) => {
            if (isDesktopRef.current && size.inPixels < 1) {
              resizeUntilApplied(() => sidebarPanelRef.current, SIDEBAR_RAIL_WIDTH, { current: false });
              setRailCollapsed(true);
              writeRailCollapsed(true);
            }
          }}
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
