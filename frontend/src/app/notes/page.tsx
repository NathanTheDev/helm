"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getNotes, type Note } from "@/lib/notesApi";

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotes()
      .then(setNotes)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <Link href="/" className="w-fit text-sm text-ink-muted transition-colors hover:text-ink">
        ← Back home
      </Link>

      <div className="mt-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Notes</h1>
        <span className="font-mono text-xs text-ink-muted">
          {loading || failed ? "—" : `${notes.length} notes`}
        </span>
      </div>
      <p className="mt-2 max-w-md text-ink-muted">
        Write alone, publish when you want company.
      </p>

      {loading ? null : failed ? (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink">Couldn&rsquo;t reach the server.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Make sure the backend is running, then refresh.
          </p>
        </div>
      ) : notes.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink">No notes yet.</p>
          <Link href="/notes/new" className="mt-3 inline-block text-sm text-clay hover:underline">
            Start writing →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-paper/60"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {note.title || "Untitled note"}
                </span>
                {note.published && (
                  <span className="shrink-0 rounded-full bg-clay-soft px-2 py-0.5 font-mono text-[10px] text-clay">
                    published
                  </span>
                )}
                <span className="shrink-0 font-mono text-xs text-ink-muted">
                  {formatUpdated(note.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
