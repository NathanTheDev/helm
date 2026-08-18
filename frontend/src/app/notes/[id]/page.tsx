"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getNote, updateNote, publishNote, closeNote, type Note } from "@/lib/notesApi";
import { useAuth } from "@/lib/auth-context";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { CollabEditor } from "@/components/notes/CollabEditor";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoteSkeleton } from "./loading";

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
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
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
    setPublishError(null);
    try {
      const updated = await publishNote(id);
      setNote(updated);
    } catch {
      setPublishError("Couldn't publish this note. Try again.");
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
        <EmptyState
          tone="error"
          className="mt-10"
          title="Couldn’t load this note."
          description="It may not exist, or the backend is unreachable."
        />
      </main>
    );
  }

  if (!note) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
        <NoteSkeleton />
      </main>
    );
  }

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
      <div className="flex items-start justify-between">
        <Link href="/" className="text-sm text-ink-muted transition-colors hover:text-ink">
          ← Back home
        </Link>
        <div className="flex flex-col items-end gap-1.5">
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
              <Button size="md" onClick={handlePublish} disabled={publishing}>
                {publishing ? "Publishing…" : "Publish"}
              </Button>
            )}
          </div>
          {publishError && <p className="text-xs text-clay-text">{publishError}</p>}
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
        <CollabEditor wsUrl={NOTES_WS_URL} room={note.externalDocId} user={user} />
      ) : (
        <div className="mt-6 flex flex-1 flex-col">
          <MarkdownEditor
            initialContent={content}
            onChange={(next) => {
              setContent(next);
              scheduleSave({ content: next });
            }}
          />
        </div>
      )}
    </main>
  );
}
