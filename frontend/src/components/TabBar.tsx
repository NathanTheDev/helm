"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <div className="hidden shrink-0 items-center gap-0.5 overflow-x-auto border-b border-line/70 bg-paper px-2 pt-2 sm:flex">
      {tabs.map((tab) => {
        const Icon = ICONS[tab.icon];
        const active = tab.href === pathname;
        return (
          <Link
            key={tab.href}
            href={tab.href}
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
  );
}
