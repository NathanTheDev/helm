import { STATUS_COLUMNS } from "@/lib/tasksApi";
import { cardClasses } from "@/components/ui/Card";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <span className="w-fit text-sm text-ink-muted">← All projects</span>
      <div className="mt-6 h-9 w-48 animate-pulse rounded-control bg-surface" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {STATUS_COLUMNS.map(({ status, label }) => (
          <section key={status} className="flex flex-col">
            <div className="mb-3 px-1">
              <h2 className="text-sm font-medium text-ink">{label}</h2>
            </div>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className={cardClasses({ padding: "none", className: "h-20 animate-pulse" })} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
