"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getNotes, type Note } from "@/lib/notesApi";
import { cardClasses } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

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
        <EmptyState
          tone="error"
          className="mt-10"
          title="Couldn’t reach the server."
          description="Make sure the backend is running, then refresh."
        />
      ) : notes.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="No notes yet."
          action={<LinkButton href="/notes/new" size="sm">Start writing →</LinkButton>}
        />
      ) : (
        <ul className={cardClasses({ padding: "none", className: "mt-6 divide-y divide-line overflow-hidden" })}>
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-paper/60"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {note.title || "Untitled note"}
                </span>
                {note.published && <Badge tone="accent" size="xs">published</Badge>}
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
