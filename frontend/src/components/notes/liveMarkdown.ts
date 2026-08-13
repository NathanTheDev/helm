import { RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { syntaxTree, syntaxHighlighting } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import { markdownHighlightStyle } from "./markdownHighlightStyle";

// Obsidian-style "live preview": headings render at their real size, and
// markup marks (#, **, `, [ ]( )) only show on the line the cursor is
// touching - everywhere else they're hidden and just the styled result
// (already colored/weighted by markdownHighlightStyle) is left on screen.
// List markers and blockquote bars stay visible always, same as Obsidian -
// they're navigational structure, not noise to hide.

const HEADING_LINE_CLASS: Record<string, string> = {
  ATXHeading1: "cm-live-h1",
  ATXHeading2: "cm-live-h2",
  ATXHeading3: "cm-live-h3",
  ATXHeading4: "cm-live-h4",
  ATXHeading5: "cm-live-h5",
  ATXHeading6: "cm-live-h6",
};

// Node types whose raw markup only earns its keep while you're editing that
// line - hidden otherwise so the rendered result reads clean.
const HIDE_WHEN_LINE_INACTIVE = new Set(["HeaderMark", "EmphasisMark", "CodeMark", "LinkMark", "URL", "QuoteMark"]);

const hiddenMark = Decoration.mark({ class: "cm-live-hidden" });
const inlineCodeMark = Decoration.mark({ class: "cm-live-code" });
const listMarkMark = Decoration.mark({ class: "cm-live-listmark" });
const quoteLine = Decoration.line({ class: "cm-live-quote" });

function lineIsActive(view: EditorView, lineFrom: number, lineTo: number): boolean {
  return view.state.selection.ranges.some((range) => range.from <= lineTo && range.to >= lineFrom);
}

function buildDecorations(view: EditorView): DecorationSet {
  const entries: { from: number; to: number; deco: Decoration }[] = [];
  const quotedLines = new Set<number>();

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        const headingClass = HEADING_LINE_CLASS[node.type.name];
        if (headingClass) {
          const line = view.state.doc.lineAt(node.from);
          entries.push({ from: line.from, to: line.from, deco: Decoration.line({ class: headingClass }) });
          return;
        }

        if (node.type.name === "Blockquote") {
          for (let pos = node.from; pos <= node.to; ) {
            const line = view.state.doc.lineAt(pos);
            if (!quotedLines.has(line.from)) {
              quotedLines.add(line.from);
              entries.push({ from: line.from, to: line.from, deco: quoteLine });
            }
            pos = line.to + 1;
          }
          return;
        }

        if (node.type.name === "InlineCode") {
          entries.push({ from: node.from, to: node.to, deco: inlineCodeMark });
          return;
        }

        if (node.type.name === "ListMark") {
          entries.push({ from: node.from, to: node.to, deco: listMarkMark });
          return;
        }

        if (HIDE_WHEN_LINE_INACTIVE.has(node.type.name)) {
          const line = view.state.doc.lineAt(node.from);
          if (!lineIsActive(view, line.from, line.to)) {
            entries.push({ from: node.from, to: node.to, deco: hiddenMark });
          }
        }
      },
    });
  }

  entries.sort((a, b) => a.from - b.from || a.to - b.to);
  const builder = new RangeSetBuilder<Decoration>();
  for (const entry of entries) builder.add(entry.from, entry.to, entry.deco);
  return builder.finish();
}

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (instance) => instance.decorations },
);

const liveMarkdownTheme = EditorView.theme({
  "&": { height: "100%", backgroundColor: "transparent" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-plex-mono), monospace", fontSize: "0.9rem" },
  ".cm-content": { padding: "0", caretColor: "var(--clay)" },
  ".cm-gutters": { display: "none" },
  ".cm-live-hidden": { display: "none" },
  ".cm-live-code": {
    borderRadius: "0.25rem",
    padding: "0.05em 0.3em",
    // 40% mix, not solid --clay-soft: solid clay-soft only clears ~4:1
    // against the --slate code text color (fails AA in the Meadow theme,
    // borderline in Paper) - matches the bg-clay-soft/40 MarkdownPreview
    // already uses for rendered inline code.
    backgroundColor: "color-mix(in srgb, var(--clay-soft) 40%, var(--surface))",
  },
  ".cm-live-listmark": { color: "var(--clay)", fontWeight: "700" },
  ".cm-live-quote": {
    borderLeft: "2px solid var(--clay)",
    paddingLeft: "0.75rem",
  },
  ".cm-live-h1, .cm-live-h2, .cm-live-h3, .cm-live-h4, .cm-live-h5, .cm-live-h6": {
    fontFamily: "var(--font-display)",
    fontWeight: "700",
  },
  ".cm-live-h1": { fontSize: "1.6em", lineHeight: "1.4" },
  ".cm-live-h2": { fontSize: "1.35em", lineHeight: "1.4" },
  ".cm-live-h3": { fontSize: "1.15em", lineHeight: "1.4" },
  ".cm-live-h4": { fontSize: "1.05em" },
  ".cm-live-h5": { fontSize: "1em" },
  ".cm-live-h6": { fontSize: "1em" },
});

// Shared by MarkdownEditor and useYjsEditor - both mount a CodeMirror
// instance over the same markdown dialect and want the same live-preview
// rendering; only their document source (plain doc vs. yCollab) differs.
export const liveMarkdownExtensions: Extension[] = [
  markdown(),
  syntaxHighlighting(markdownHighlightStyle),
  EditorView.lineWrapping,
  livePreviewPlugin,
  liveMarkdownTheme,
];
