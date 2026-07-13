import { cardClasses } from "@/components/ui/Card";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <span className="w-fit text-sm text-ink-muted">← Back home</span>

      <div className="mt-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Notes</h1>
      </div>
      <p className="mt-2 max-w-md text-ink-muted">
        Write alone, publish when you want company.
      </p>

      <div className={cardClasses({ padding: "none", className: "mt-6 divide-y divide-line overflow-hidden" })}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="h-4 w-40 animate-pulse rounded bg-paper sm:w-64" />
            <div className="ml-auto h-3 w-16 shrink-0 animate-pulse rounded bg-paper" />
          </div>
        ))}
      </div>
    </main>
  );
}
