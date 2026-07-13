"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getNote, updateNote, publishNote, closeNote, type Note } from "@/lib/notesApi";
import { useAuth } from "@/lib/auth-context";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { MarkdownPreview } from "@/components/notes/MarkdownPreview";
import { CollabEditor } from "@/components/notes/CollabEditor";

const AUTOSAVE_DELAY_MS = 800;
const NOTES_WS_URL = process.env.NEXT_PUBLIC_NOTES_WS_URL ?? "ws://localhost:1234";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function NotePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [note, setNote] = useState<Note | null>(null);
  const [failed, setFailed] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [publishing, setPublishing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Once published, content flows through Yjs/CollabEditor instead - the
  // plain editor (the only thing that calls scheduleSave with `content`)
  // unmounts at that point, so this keeps saving titles for both modes and
  // content only pre-publish, without needing a branch here.
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

  async function handlePublish() {
    setPublishing(true);
    try {
      const updated = await publishNote(id);
      setNote(updated);
    } catch {
      // Save-state indicator already shows failures for title edits; a
      // failed publish just leaves the button clickable to retry.
    } finally {
      setPublishing(false);
    }
  }

  async function handleClose() {
    setClosing(true);
    try {
      const updated = await closeNote(id);
      setNote(updated);
      // Folds the collaboratively-edited content back into the plain editor,
      // which remounts fresh (with this as its initialContent) now that
      // note.published is false.
      setContent(updated.content);
      latest.current = { ...latest.current, content: updated.content };
    } catch {
      // Leaves the button clickable to retry.
    } finally {
      setClosing(false);
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

  const isOwner = note.userId === user?.uid;

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
          {isOwner && <span className="font-mono text-xs text-ink-muted">{saveLabel}</span>}

          {isOwner && note.published && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          )}

          {isOwner && note.published && (
            <button
              type="button"
              onClick={handleClose}
              disabled={closing}
              className="text-sm text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              {closing ? "Closing…" : "Close link"}
            </button>
          )}

          {isOwner && !note.published && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="rounded-full bg-clay px-4 py-1.5 text-sm font-medium text-surface transition-colors hover:bg-clay/90 disabled:opacity-50"
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
          )}

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
        disabled={!isOwner}
        onChange={(e) => {
          setTitle(e.target.value);
          scheduleSave({ title: e.target.value });
        }}
        className="mt-10 w-full bg-transparent font-display text-3xl italic text-ink placeholder:text-ink-muted/60 focus:outline-none disabled:cursor-default sm:text-4xl"
      />

      {note.published && note.externalDocId ? (
        <CollabEditor wsUrl={NOTES_WS_URL} room={note.externalDocId} user={user} mode={mode} />
      ) : mode === "edit" ? (
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
