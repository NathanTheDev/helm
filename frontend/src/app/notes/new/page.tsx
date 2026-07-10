import Link from "next/link";

export default function NewNotePage() {
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
          <button
            type="button"
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Discard
          </button>
          <button
            type="button"
            className="rounded-full bg-clay px-4 py-1.5 text-sm font-medium text-surface transition-colors hover:bg-clay/90"
          >
            Save
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Untitled note"
        className="mt-10 w-full bg-transparent font-display text-3xl italic text-ink placeholder:text-ink-muted/60 focus:outline-none sm:text-4xl"
      />

      <textarea
        placeholder="Start writing…"
        rows={16}
        className="mt-6 w-full flex-1 resize-none bg-transparent text-ink placeholder:text-ink-muted/60 focus:outline-none"
      />
    </main>
  );
}
