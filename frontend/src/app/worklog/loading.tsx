export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <span className="w-fit text-sm text-ink-muted">← Back home</span>
      <div className="mt-6">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Worklog</h1>
      </div>
      <p className="mt-2 max-w-md text-ink-muted">
        Time you&rsquo;ve tracked across every project.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[92px] animate-pulse rounded-2xl border border-line bg-surface"
          />
        ))}
      </div>
      <div className="mt-10 h-[172px] animate-pulse rounded-2xl border border-line bg-surface" />
    </main>
  );
}
