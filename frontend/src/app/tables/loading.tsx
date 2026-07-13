import { cardClasses } from "@/components/ui/Card";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <span className="w-fit text-sm text-ink-muted">← Back home</span>

      <div className="mt-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Tables</h1>
      </div>
      <p className="mt-2 max-w-md text-ink-muted">
        Build a table for anything that doesn&rsquo;t fit — your own columns, your own data.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cardClasses({ padding: "none", className: "h-[52px] animate-pulse" })} />
        ))}
      </div>
    </main>
  );
}
