"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

type SplitViewContextValue = {
  splitHref: string | null;
  openSplit: (href: string) => void;
  closeSplit: () => void;
  // Which tab (by href) is currently being drag-and-dropped, if any - not
  // about the split itself, but shared here (rather than a separate
  // context) since the only consumers are TabBar (sets it on drag
  // start/end) and SplitDropZone (reads it to know whether to render its
  // overlay at all, see that component). null outside of an active drag.
  draggingHref: string | null;
  setDraggingHref: (href: string | null) => void;
};

const SplitViewContext = createContext<SplitViewContextValue | null>(null);

// Deliberately not persisted (plain useState, no localStorage) - a split
// pane is a transient "look at two things at once" arrangement, not a
// layout preference worth restoring on the next visit. See SplitPane.tsx
// for how `splitHref` actually gets rendered (a same-origin iframe, not a
// second real route - this app's routes aren't set up as parallel routes,
// and most pages are self-contained "use client" components that fetch
// their own data, so re-mounting one in an iframe works without needing
// any of the current route's params/data threaded in manually).
export function SplitViewProvider({ children }: { children: ReactNode }) {
  const [splitHref, setSplitHref] = useState<string | null>(null);
  const [draggingHref, setDraggingHref] = useState<string | null>(null);

  const openSplit = useCallback((href: string) => setSplitHref(href), []);
  const closeSplit = useCallback(() => setSplitHref(null), []);

  return (
    <SplitViewContext.Provider value={{ splitHref, openSplit, closeSplit, draggingHref, setDraggingHref }}>
      {children}
    </SplitViewContext.Provider>
  );
}

export function useSplitView(): SplitViewContextValue {
  const ctx = useContext(SplitViewContext);
  if (!ctx) throw new Error("useSplitView must be used within a SplitViewProvider");
  return ctx;
}
