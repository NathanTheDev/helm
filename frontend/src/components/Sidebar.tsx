"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { ChevronsLeftIcon, PencilIcon, NotesIcon, HabitsIcon, ProjectsIcon, TablesIcon, BrainIcon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { readSpaceName } from "@/lib/space-name";
import { useEffect, useState } from "react";

const links = [
  { href: "/notes", label: "Notes", icon: NotesIcon },
  { href: "/habits", label: "Habits", icon: HabitsIcon },
  { href: "/projects", label: "Projects", icon: ProjectsIcon },
  { href: "/tables", label: "Tables", icon: TablesIcon },
  { href: "/brain", label: "Brain", icon: BrainIcon },
];

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

// Desktop-only vertical nav, rendered inside AppShell's resizable sidebar
// Panel. Mobile has its own top-bar equivalent - see MobileNavBar.tsx.
// Account identity (avatar/email, sign out) and the space-name editor live
// on the dashboard's top-right instead - see app/page.tsx.
export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [spaceName, setSpaceName] = useState("");

  useEffect(() => {
    setSpaceName(readSpaceName());
  }, []);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-paper px-4 py-5">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          aria-label={spaceName}
          className="flex min-w-0 items-center gap-2 font-display text-lg tracking-tight text-ink"
        >
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-clay" aria-hidden />
          {!collapsed && <span className="truncate">{spaceName}</span>}
        </Link>
        {!collapsed && (
          <div className="flex shrink-0 items-center gap-0.5">
            {user && (
              <Tooltip content="New note" side="right">
                <Link
                  href="/notes/new"
                  aria-label="New note"
                  className="flex items-center justify-center rounded-control p-1.5 text-ink-muted transition-[color,transform] hover:bg-clay-soft/40 hover:text-ink active:scale-90"
                >
                  <PencilIcon />
                </Link>
              </Tooltip>
            )}
            <Tooltip content="Collapse sidebar" side="right">
              <IconButton
                aria-label="Collapse sidebar"
                onClick={onToggleCollapsed}
                className="rounded-control p-1.5 hover:bg-clay-soft/40"
              >
                <ChevronsLeftIcon />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>

      {collapsed && (
        <Tooltip content="Expand sidebar" side="right">
          <IconButton
            aria-label="Expand sidebar"
            onClick={onToggleCollapsed}
            className="mt-3 self-center rounded-control p-1.5 hover:bg-clay-soft/40"
          >
            <ChevronsLeftIcon className="rotate-180" />
          </IconButton>
        </Tooltip>
      )}

      <nav className="mt-8 flex flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Tooltip key={link.href} content={link.label} side="right">
              <Link
                href={link.href}
                aria-label={link.label}
                className={`flex items-center gap-2.5 truncate rounded-control px-3 py-2.5 text-base transition-colors ${
                  active ? "bg-clay-soft/40 text-ink" : "text-ink-muted hover:bg-clay-soft/20 hover:text-ink"
                } ${collapsed ? "justify-center px-2" : ""}`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{link.label}</span>}
              </Link>
            </Tooltip>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-line/70 pt-4">
        <ThemeSwitcher />
        {!loading && !user && (
          <Link href="/login" className="text-sm text-ink-muted transition-colors hover:text-ink">
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
