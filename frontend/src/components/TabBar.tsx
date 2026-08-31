"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTabs, type TabIconKey } from "@/lib/tabs-context";
import { useSplitView } from "@/lib/split-view-context";
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

export function TabBar() {
  const pathname = usePathname();
  const { tabs, closeTab } = useTabs();
  const { splitHref, openSplit } = useSplitView();

  // The split tab's chip lives in its own mini header above the split
  // iframe instead (see SplitPane.tsx) - filtering it out here is what
  // moves it there rather than duplicating it in both places. Reactive to
  // `splitHref`, so un-docking (or docking a different tab) moves the chip
  // back/across automatically, no extra bookkeeping needed.
  const visibleTabs = tabs.filter((tab) => tab.href !== splitHref);

  return (
    <div className="hidden shrink-0 items-center gap-0.5 overflow-x-auto border-b border-line/70 bg-paper px-2 pt-2 sm:flex">
      {visibleTabs.map((tab) => {
        const Icon = ICONS[tab.icon];
        const active = tab.href === pathname;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            // Browsers treat a middle click on an <a> as "open in new tab"
            // by default (auxclick fires, then that default action) - for
            // this app's own tab strip that reads as broken (a duplicate
            // tab, or literally a new browser tab, for what every other
            // tabbed UI treats as "close"). preventDefault on auxclick for
            // button 1 (middle) suppresses that browser default; closeTab
            // already no-ops on the permanent "/" Home tab, so no need to
            // special-case it here the way the close button does.
            onAuxClick={(e) => {
              if (e.button !== 1) return;
              e.preventDefault();
              e.stopPropagation();
              closeTab(tab.href);
            }}
            className={`group flex w-fit max-w-[180px] shrink-0 items-center gap-1.5 rounded-t-control border border-b-0 px-3 py-1.5 text-xs transition-colors ${
              active
                ? "border-line bg-surface text-ink"
                : "border-transparent text-ink-muted hover:bg-clay-soft/20 hover:text-ink"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{tab.label}</span>
            <button
              type="button"
              aria-label={`Open ${tab.label} in split view`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openSplit(tab.href);
              }}
              className="-mr-0.5 shrink-0 rounded-control p-0.5 opacity-0 transition-opacity hover:bg-clay-soft/60 group-hover:opacity-100"
            >
              <DockRightIcon className="h-3 w-3" />
            </button>
            {tab.href !== "/" && (
              <button
                type="button"
                aria-label={`Close ${tab.label}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeTab(tab.href);
                }}
                className="-mr-1 shrink-0 rounded-control p-0.5 opacity-0 transition-opacity hover:bg-clay-soft/60 group-hover:opacity-100"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            )}
          </Link>
        );
      })}
    </div>
  );
}
