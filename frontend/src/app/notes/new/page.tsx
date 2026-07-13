"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createNote } from "@/lib/notesApi";

export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const note = await createNote({
        title: title.trim() || undefined,
        content,
      });
      router.push(`/notes/${note.id}`);
    } catch {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-ink-muted transition-colors hover:text-ink"
        >
          ← Back home
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Discard
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-clay px-4 py-1.5 text-sm font-medium text-surface transition-colors hover:bg-clay/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Untitled note"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-10 w-full bg-transparent font-display text-3xl italic text-ink placeholder:text-ink-muted/60 focus:outline-none sm:text-4xl"
      />

      <textarea
        placeholder="Start writing…"
        rows={16}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="mt-6 w-full flex-1 resize-none bg-transparent text-ink placeholder:text-ink-muted/60 focus:outline-none"
      />
    </main>
  );
}
