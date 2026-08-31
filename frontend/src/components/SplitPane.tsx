"use client";

import type { ReactNode } from "react";
import { useTabs, type TabIconKey } from "@/lib/tabs-context";
import {
  HomeIcon,
  NotesIcon,
  HabitsIcon,
  ProjectsIcon,
  TablesIcon,
  BrainIcon,
  ClockIcon,
  CloseIcon,
  DockRightIcon,
} from "@/components/ui/Icon";

const ICONS: Record<TabIconKey, (props: { className?: string }) => React.JSX.Element> = {
  home: HomeIcon,
  notes: NotesIcon,
  habits: HabitsIcon,
  projects: ProjectsIcon,
  tables: TablesIcon,
  brain: BrainIcon,
  worklog: ClockIcon,
};

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
  // TabBar filters the split tab's own chip out of the shared strip (see
  // its `visibleTabs`) so it doesn't appear twice - this header is where it
  // actually lives instead, sitting directly above the pane its chip
  // refers to rather than mixed into the row above both panes.
  const { tabs, closeTab } = useTabs();
  const splitTab = tabs.find((tab) => tab.href === splitHref);
  const Icon = splitTab ? ICONS[splitTab.icon] : null;

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{mainChildren}</div>
      <div className="flex min-h-0 flex-1 flex-col border-l border-line/70">
        <div className="flex shrink-0 items-center gap-0.5 border-b border-line/70 bg-paper px-2 pt-2">
          <div className="group flex w-fit max-w-[180px] shrink-0 items-center gap-1.5 rounded-t-control border border-clay/40 bg-clay-soft/20 px-3 py-1.5 text-xs text-ink">
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{splitTab?.label ?? "Split view"}</span>
            <button
              type="button"
              aria-label="Close split view"
              onClick={onCloseSplit}
              className="-mr-0.5 shrink-0 rounded-control p-0.5 text-clay transition-opacity hover:bg-clay-soft/60"
            >
              <DockRightIcon className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label={splitTab ? `Close ${splitTab.label}` : "Close tab"}
              onClick={() => {
                onCloseSplit();
                if (splitTab) closeTab(splitTab.href);
              }}
              className="-mr-1 shrink-0 rounded-control p-0.5 opacity-0 transition-opacity hover:bg-clay-soft/60 group-hover:opacity-100"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
        <iframe src={splitHref} title="Split view" className="h-full w-full flex-1 border-0 bg-paper" />
      </div>
    </div>
  );
}
