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
  const { splitHref, closeSplit, setDraggingHref } = useSplitView();

  // The split tab's chip renders in its own half of this same row (right
  // of the divider, see below) instead of the shared scroll region -
  // filtering it out of the main list is what moves it there rather than
  // showing it in both places. Reactive to `splitHref`, so docking a
  // different tab or un-docking moves the chip across/back automatically.
  const visibleTabs = tabs.filter((tab) => tab.href !== splitHref);
  const splitTab = tabs.find((tab) => tab.href === splitHref);

  return (
    // A single flex row, not two stacked ones - the split chip has to sit
    // at the same vertical position as the main tabs (level with "Home"),
    // not on a row of its own below them. Splitting this one row into two
    // flex-1 halves (divided by the border-l) is also what keeps the
    // divider lined up with SplitPane's own flex-1/flex-1 content split
    // directly below, since both start from the same container width.
    <div className="hidden shrink-0 border-b border-line/70 bg-paper sm:flex">
      <div className="flex flex-1 items-center gap-0.5 overflow-x-auto px-2 pt-2">
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
              // Opening a tab in split view used to be a dedicated hover
              // button - replaced with plain HTML5 drag-and-drop (native
              // anchor dragging, no dnd-kit needed - that's for the
              // sortable dashboard widgets, a different interaction shape)
              // so dragging the tab chip itself onto SplitDropZone's
              // right-half overlay is what opens it there now. `dataTransfer`
              // carries the href rather than reading component state in the
              // drop handler, since the drop target has no other way to know
              // which tab was dragged. `draggingHref` (context, not local
              // state) is what SplitDropZone reads to know whether to render
              // its overlay at all - reset in onDragEnd unconditionally so a
              // drag cancelled outside any valid drop target (e.g. Escape)
              // doesn't leave the overlay stuck mounted.
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", tab.href);
                e.dataTransfer.effectAllowed = "move";
                setDraggingHref(tab.href);
              }}
              onDragEnd={() => setDraggingHref(null)}
              className={`group flex w-fit max-w-[180px] shrink-0 items-center gap-1.5 rounded-t-control border border-b-0 px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "border-line bg-surface text-ink"
                  : "border-transparent text-ink-muted hover:bg-clay-soft/20 hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
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
      {splitHref && splitTab && (
        <div className="flex flex-1 items-center gap-0.5 overflow-x-auto border-l border-line/70 px-2 pt-2">
          <div className="group flex w-fit max-w-[180px] shrink-0 items-center gap-1.5 rounded-t-control border border-b-0 border-clay/40 bg-clay-soft/20 px-3 py-1.5 text-xs text-ink">
            {(() => {
              const Icon = ICONS[splitTab.icon];
              return <Icon className="h-3.5 w-3.5 shrink-0" />;
            })()}
            <span className="truncate">{splitTab.label}</span>
            <button
              type="button"
              aria-label="Close split view"
              onClick={closeSplit}
              className="-mr-0.5 shrink-0 rounded-control p-0.5 text-clay transition-opacity hover:bg-clay-soft/60"
            >
              <DockRightIcon className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label={`Close ${splitTab.label}`}
              onClick={() => {
                closeSplit();
                closeTab(splitTab.href);
              }}
              className="-mr-1 shrink-0 rounded-control p-0.5 opacity-0 transition-opacity hover:bg-clay-soft/60 group-hover:opacity-100"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
