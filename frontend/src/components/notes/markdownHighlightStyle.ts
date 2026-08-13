import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

// Colors reference CSS vars so the same style works across every [data-theme].
// Pulled into both editors via liveMarkdown.ts's shared extension list.
export const markdownHighlightStyle = HighlightStyle.define([
  { tag: [tags.heading1, tags.heading2, tags.heading3, tags.heading4, tags.heading5, tags.heading6], fontWeight: "700", color: "var(--ink)" },
  { tag: tags.strong, fontWeight: "700", color: "var(--ink)" },
  { tag: tags.emphasis, fontStyle: "italic" },
  // clay-text, not clay: this colors real link text, not decoration - see
  // the --clay-text comment in globals.css.
  { tag: tags.link, color: "var(--clay-text)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--ink-muted)" },
  { tag: tags.monospace, color: "var(--slate)" },
  { tag: tags.quote, color: "var(--ink-muted)", fontStyle: "italic" },
  // No color rule for tags.list: lezer-markdown tags BulletList/OrderedList
  // "/..." (recursively, covering all list item body text, not just the
  // marker) - coloring it would recolor ordinary sentences inside lists.
  // The bullet/number glyph itself is tagged separately as ListMark, which
  // processingInstruction below already covers.
  { tag: tags.processingInstruction, color: "var(--ink-muted)" },
  { tag: tags.comment, color: "var(--ink-muted)" },
]);
