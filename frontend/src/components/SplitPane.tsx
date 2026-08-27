"use client";

import type { ReactNode } from "react";
import { CloseIcon } from "@/components/ui/Icon";

// Right-hand pane is a same-origin iframe loading the split tab's own route
// rather than a second parallel-routed React tree - this app's App Router
// setup only has one route active at a time, and most pages are already
// self-contained "use client" components that fetch their own data, so an
// iframe gets a fully working, independently-scrollable pane for any route
// (including dynamic ones like /notes/[id]) with no per-page changes. It
// detects it's embedded via `isEmbedded()` (see lib/embed.ts) and renders
// without Sidebar/TabBar/MobileNavBar chrome - see AppShell's embed branch.
export function SplitPane({ mainChildren, splitHref, onCloseSplit }: {
  mainChildren: ReactNode;
  splitHref: string;
  onCloseSplit: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{mainChildren}</div>
      <div className="relative flex min-h-0 flex-1 flex-col border-l border-line/70">
        <button
          type="button"
          onClick={onCloseSplit}
          aria-label="Close split view"
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-control border border-line bg-surface text-ink-muted shadow-sm transition-colors hover:border-clay hover:text-clay"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
        <iframe src={splitHref} title="Split view" className="h-full w-full flex-1 border-0 bg-paper" />
      </div>
    </div>
  );
}
