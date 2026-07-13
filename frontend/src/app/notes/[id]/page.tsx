"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getNote, updateNote, type Note } from "@/lib/notesApi";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { MarkdownPreview } from "@/components/notes/MarkdownPreview";

const AUTOSAVE_DELAY_MS = 800;

type SaveState = "idle" | "saving" | "saved" | "error";

export default function NotePage() {
  const { id } = useParams<{ id: string }>();

  const [note, setNote] = useState<Note | null>(null);
  const [failed, setFailed] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title: "", content: "" });

  useEffect(() => {
    getNote(id)
      .then((loaded) => {
        setNote(loaded);
        setTitle(loaded.title);
        setContent(loaded.content);
        latest.current = { title: loaded.title, content: loaded.content };
      })
      .catch(() => setFailed(true));
  }, [id]);

  function scheduleSave(next: Partial<{ title: string; content: string }>) {
    latest.current = { ...latest.current, ...next };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        await updateNote(id, latest.current);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (failed) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
        <Link href="/" className="w-fit text-sm text-ink-muted transition-colors hover:text-ink">
          ← Back home
        </Link>
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink">Couldn&rsquo;t load this note.</p>
          <p className="mt-1 text-sm text-ink-muted">
            It may not exist, or the backend is unreachable.
          </p>
        </div>
      </main>
    );
  }

  if (!note) return null;

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Couldn't save"
          : "";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-ink-muted transition-colors hover:text-ink">
          ← Back home
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-ink-muted">{saveLabel}</span>
          <div className="flex overflow-hidden rounded-full border border-line text-sm">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`px-3 py-1 transition-colors ${
                mode === "edit" ? "bg-clay text-surface" : "text-ink-muted hover:text-ink"
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`px-3 py-1 transition-colors ${
                mode === "preview" ? "bg-clay text-surface" : "text-ink-muted hover:text-ink"
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      <input
        type="text"
        placeholder="Untitled note"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          scheduleSave({ title: e.target.value });
        }}
        className="mt-10 w-full bg-transparent font-display text-3xl italic text-ink placeholder:text-ink-muted/60 focus:outline-none sm:text-4xl"
      />

      {mode === "edit" ? (
        <MarkdownEditor
          initialContent={content}
          onChange={(next) => {
            setContent(next);
            scheduleSave({ content: next });
          }}
        />
      ) : (
        <MarkdownPreview content={content} />
      )}
    </main>
  );
}
