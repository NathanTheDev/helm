// True when this document is rendered inside another document's <iframe> -
// used by the split-view pane (see SplitPane.tsx) to detect "I'm the
// secondary pane" without a URL query param (which would have to be
// stripped/threaded through every route). Anything embed-aware should also
// avoid touching state shared with the parent document (e.g. the tab list's
// localStorage key) - a same-origin iframe would otherwise silently mutate
// it, desyncing the real tab bar from what's actually open.
export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin frame access throws instead of returning false - can't
    // happen for our own same-origin iframe, but fail safe (treat as
    // embedded, the more conservative assumption) rather than let it bubble.
    return true;
  }
}
