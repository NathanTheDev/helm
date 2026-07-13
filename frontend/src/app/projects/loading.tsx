import { cardClasses } from "@/components/ui/Card";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <span className="w-fit text-sm text-ink-muted">← Back home</span>
      <div className="mt-6">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Projects</h1>
      </div>
      <p className="mt-2 max-w-md text-ink-muted">
        Each project is a board. Pick one to plan and track your work.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cardClasses({ padding: "none", className: "h-[104px] animate-pulse" })} />
        ))}
      </div>
    </main>
  );
}
