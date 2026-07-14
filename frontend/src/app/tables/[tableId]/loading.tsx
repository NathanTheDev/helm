import { cardClasses } from "@/components/ui/Card";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <span className="w-fit text-sm text-ink-muted">← All tables</span>
      <div className="mt-6 h-9 w-48 animate-pulse rounded-control bg-surface" />
      <div className={cardClasses({ padding: "none", className: "mt-8 h-14 animate-pulse" })} />
    </main>
  );
}
