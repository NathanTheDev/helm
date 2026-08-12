export function NoteSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="w-fit text-sm text-ink-muted">← Back home</span>
        <div className="h-9 w-20 animate-pulse rounded-control bg-surface" />
      </div>
      <div className="mt-6 h-10 w-2/3 animate-pulse rounded-control bg-surface" />
      <div className="mt-6 h-64 animate-pulse rounded-card border border-line bg-surface" />
    </>
  );
}

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <NoteSkeleton />
    </main>
  );
}
