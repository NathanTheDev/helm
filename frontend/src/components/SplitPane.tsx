"use client";

import type { ReactNode } from "react";

// Right-hand pane is a same-origin iframe loading the split tab's own route
// rather than a second parallel-routed React tree - this app's App Router
// setup only has one route active at a time, and most pages are already
// self-contained "use client" components that fetch their own data, so an
// iframe gets a fully working, independently-scrollable pane for any route
// (including dynamic ones like /notes/[id]) with no per-page changes. It
// detects it's embedded via `isEmbedded()` (see lib/embed.ts) and renders
// without Sidebar/TabBar/MobileNavBar chrome - see AppShell's embed branch.
//
// No header of its own - the split tab's chip (icon/label, dock/close
// buttons) lives in TabBar's own row instead, in a matching flex-1 half
// split by the same ratio as this component's two panes, so the chip sits
// level with the rest of the tab strip rather than on a row below it. See
// TabBar.tsx's `splitTab` branch.
//
// The iframe pane is `hidden sm:flex` - side-by-side never makes sense at
// phone width (nowhere to put two panes), matching TabBar's own `sm:`-only
// visibility and the drag gesture that opens a split being desktop-only to
// begin with. This is a CSS-only guard, not a JS breakpoint check, so it
// also covers `splitHref` surviving a live window resize down from desktop
// (state isn't reset just because the viewport shrank) - the iframe pane
// disappears and `mainChildren` reclaims the full width automatically via
// its own `flex-1`, no JS needed to notice the breakpoint changed.
export function SplitPane({ mainChildren, splitHref }: {
  mainChildren: ReactNode;
  splitHref: string;
}) {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{mainChildren}</div>
      <div className="hidden min-h-0 flex-1 flex-col border-l border-line/70 sm:flex">
        <iframe src={splitHref} title="Split view" className="h-full w-full flex-1 border-0 bg-paper" />
      </div>
    </div>
  );
}
