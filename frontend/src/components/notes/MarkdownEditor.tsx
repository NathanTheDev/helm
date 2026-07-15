"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting } from "@codemirror/language";
import { markdownHighlightStyle } from "./markdownHighlightStyle";

// Plain (non-collaborative) markdown editor. Uncontrolled by design: it
// mounts once with `initialContent` and reports changes via `onChange` -
// re-feeding `content` back in as a controlled prop would fight the
// editor's own cursor position on every keystroke.
export function MarkdownEditor({
  initialContent,
  onChange,
}: {
  initialContent: string;
  onChange: (content: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      doc: initialContent,
      extensions: [
        basicSetup,
        markdown(),
        syntaxHighlighting(markdownHighlightStyle),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
        }),
        EditorView.theme({
          "&": { height: "100%", backgroundColor: "transparent" },
          "&.cm-focused": { outline: "none" },
          ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-plex-mono), monospace", fontSize: "0.9rem" },
          ".cm-content": { padding: "0", caretColor: "var(--clay)" },
          ".cm-gutters": { display: "none" },
        }),
      ],
      parent: containerRef.current,
    });

    return () => view.destroy();
    // Intentionally mount-once - see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="mt-6 min-h-[16rem] flex-1 rounded-card border border-line bg-surface p-4"
    />
  );
}
