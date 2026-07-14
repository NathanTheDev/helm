import { cardClasses } from "@/components/ui/Card";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <span className="w-fit text-sm text-ink-muted">← All tables</span>
      <div className="mt-6 h-9 w-48 animate-pulse rounded-control bg-surface" />

      <div className="mt-8 flex flex-col gap-4">
        <div className="h-[52px] animate-pulse rounded-card bg-surface" />
        <div className={cardClasses({ padding: "none", className: "h-[220px] animate-pulse" })} />
        <div className="h-[52px] animate-pulse rounded-card border border-dashed border-line" />
      </div>
    </main>
  );
}
