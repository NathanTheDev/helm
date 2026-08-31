"use client";

import { useState } from "react";
import { useSplitView } from "@/lib/split-view-context";

// Covers the right half of the content area, but only while a tab chip is
// actually being dragged (`draggingHref` set by TabBar's onDragStart) -
// unmounted otherwise so it never intercepts normal clicks/scrolling over
// that region. Sits as an absolutely-positioned sibling of whatever's
// already rendered there (the single-pane content, or an existing
// SplitPane if one's already open) - dropping here always calls
// `openSplit`, so dragging a new tab onto an already-open split replaces
// it, same as the old dock button did.
//
// `hidden sm:flex` on top of the `draggingHref` check: dragging is
// initiated from TabBar, which is itself `hidden sm:flex` (still mounted
// below that breakpoint, just not displayed), and most mobile browsers
// don't fire HTML5 drag events from touch anyway - but side-by-side has
// to be flatly impossible below `sm`, not just impossible-in-practice, so
// this is a belt-and-suspenders CSS guard rather than relying on that.
export function SplitDropZone() {
  const { draggingHref, openSplit, setDraggingHref } = useSplitView();
  const [isOver, setIsOver] = useState(false);

  if (!draggingHref) return null;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDragEnter={() => setIsOver(true)}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        const href = e.dataTransfer.getData("text/plain");
        if (href) openSplit(href);
        setIsOver(false);
        setDraggingHref(null);
      }}
      className={`absolute inset-y-0 right-0 z-20 hidden w-1/2 items-center justify-center border-l-2 border-dashed transition-colors sm:flex ${
        isOver ? "border-clay bg-clay-soft/40" : "border-clay/40 bg-clay-soft/15"
      }`}
    >
      <span className="rounded-control bg-surface px-3 py-1.5 text-sm text-ink-muted shadow-sm">
        Drop to open in split view
      </span>
    </div>
  );
}
