import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

// Colors reference CSS vars so the same style works across every [data-theme].
// Shared by MarkdownEditor and useYjsEditor's CodeMirror instances.
export const markdownHighlightStyle = HighlightStyle.define([
  { tag: [tags.heading1, tags.heading2, tags.heading3, tags.heading4, tags.heading5, tags.heading6], fontWeight: "700", color: "var(--ink)" },
  { tag: tags.strong, fontWeight: "700", color: "var(--ink)" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.link, color: "var(--clay)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--ink-muted)" },
  { tag: tags.monospace, color: "var(--slate)" },
  { tag: tags.quote, color: "var(--ink-muted)", fontStyle: "italic" },
  { tag: tags.list, color: "var(--clay)" },
  { tag: tags.processingInstruction, color: "var(--ink-muted)" },
  { tag: tags.comment, color: "var(--ink-muted)" },
]);
