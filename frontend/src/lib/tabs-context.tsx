"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_PATHS } from "@/lib/auth-paths";
import { isEmbedded } from "@/lib/embed";

export type TabIconKey = "home" | "notes" | "habits" | "projects" | "tables" | "brain" | "worklog";

export type Tab = { href: string; label: string; icon: TabIconKey };

const HOME_TAB: Tab = { href: "/", label: "Home", icon: "home" };
const STORAGE_KEY = "helm-open-tabs";

function deriveTabMeta(pathname: string): { label: string; icon: TabIconKey } {
  if (pathname === "/") return { label: "Home", icon: "home" };
  if (pathname === "/notes/new") return { label: "New note", icon: "notes" };
  if (pathname === "/notes") return { label: "Notes", icon: "notes" };
  if (pathname.startsWith("/notes/")) return { label: "Note", icon: "notes" };
  if (pathname === "/habits") return { label: "Habits", icon: "habits" };
  if (pathname === "/projects") return { label: "Projects", icon: "projects" };
  if (pathname.startsWith("/projects/")) return { label: "Project", icon: "projects" };
  if (pathname === "/tables") return { label: "Tables", icon: "tables" };
  if (pathname.startsWith("/tables/")) return { label: "Table", icon: "tables" };
  if (pathname === "/brain/settings") return { label: "Brain settings", icon: "brain" };
  if (pathname === "/brain") return { label: "Brain", icon: "brain" };
  if (pathname === "/worklog") return { label: "Worklog", icon: "worklog" };
  return { label: pathname, icon: "home" };
}

function readTabs(): Tab[] {
  if (typeof window === "undefined") return [HOME_TAB];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [HOME_TAB];
    const parsed = JSON.parse(raw) as Tab[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [HOME_TAB];
    return parsed[0]?.href === "/" ? parsed : [HOME_TAB, ...parsed.filter((t) => t.href !== "/")];
  } catch {
    return [HOME_TAB];
  }
}

function writeTabs(tabs: Tab[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
}

type TabsContextValue = {
  tabs: Tab[];
  closeTab: (href: string) => void;
  updateTabTitle: (href: string, label: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

// Obsidian-style tabs for the content area: every route the user visits
// (via sidebar links, in-page links, or a direct URL) becomes an open tab,
// deduped by href - navigating to an already-open href just focuses it
// rather than opening a duplicate. "/" is the permanent, unclosable base
// tab. Tabs don't keep their route's component instance alive in the
// background (that would need a much larger keep-alive/offscreen-render
// mechanism) - switching tabs is a normal Next.js client navigation, and
// the tab strip is a persisted record of what's been opened.
export function TabsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tabs, setTabs] = useState<Tab[]>([HOME_TAB]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // A split-view pane is a same-origin iframe running this exact same
    // provider - if it read/wrote the real "helm-open-tabs" key too, it'd
    // silently register its own pathname as a tab in the *parent* window's
    // tab bar. It never renders TabBar (see AppShell's embed branch) so
    // there's nothing for a local tab list to drive anyway; just skip
    // touching storage entirely and leave it at the default.
    if (isEmbedded()) return;
    setTabs(readTabs());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || isEmbedded()) return;
    writeTabs(tabs);
  }, [tabs, hydrated]);

  useEffect(() => {
    if (!hydrated || isEmbedded()) return;
    if (AUTH_PATHS.has(pathname)) return;
    setTabs((prev) => {
      if (prev.some((t) => t.href === pathname)) return prev;
      const meta = deriveTabMeta(pathname);
      return [...prev, { href: pathname, label: meta.label, icon: meta.icon }];
    });
  }, [pathname, hydrated]);

  const closeTab = useCallback(
    (href: string) => {
      if (href === "/") return;
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.href === href);
        if (idx === -1) return prev;
        const next = prev.filter((t) => t.href !== href);
        if (pathname === href) {
          const neighbor = next[idx - 1] ?? next[idx] ?? HOME_TAB;
          router.push(neighbor.href);
        }
        return next;
      });
    },
    [pathname, router],
  );

  const updateTabTitle = useCallback((href: string, label: string) => {
    setTabs((prev) => prev.map((t) => (t.href === href && t.label !== label ? { ...t, label } : t)));
  }, []);

  return <TabsContext.Provider value={{ tabs, closeTab, updateTabTitle }}>{children}</TabsContext.Provider>;
}

export function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabs must be used within a TabsProvider");
  return ctx;
}

// Lets a dynamic-route page (a specific note/project/table) push its own
// loaded title up into its tab's label once known, instead of the generic
// placeholder deriveTabMeta assigns before that data arrives.
export function useTabTitle(title: string | null | undefined) {
  const { updateTabTitle } = useTabs();
  const pathname = usePathname();
  useEffect(() => {
    if (title) updateTabTitle(pathname, title);
  }, [pathname, title, updateTabTitle]);
}
