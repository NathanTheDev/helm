import Link from "next/link";

const days = ["M", "T", "W", "T", "F", "S", "S"];

const habits = [
  { name: "Reading", streak: 12, pattern: [1, 1, 1, 1, 1, 1, 1] },
  { name: "Morning walk", streak: 0, pattern: [1, 1, 1, 1, 1, 1, 0] },
  { name: "Drink water", streak: 5, pattern: [1, 1, 0, 1, 1, 1, 1] },
  { name: "Meditate", streak: 3, pattern: [0, 0, 1, 1, 1, 1, 1] },
];

export default function HabitsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <Link
        href="/"
        className="w-fit text-sm text-ink-muted transition-colors hover:text-ink"
      >
        ← Back home
      </Link>

      <div className="mt-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Habits</h1>
        <span className="font-mono text-xs text-ink-muted">
          {habits.length} tracked
        </span>
      </div>
      <p className="mt-2 max-w-md text-ink-muted">
        A quiet place to keep the streaks you care about.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {habits.map((habit) => (
          <div
            key={habit.name}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">{habit.name}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${
                  habit.streak > 0
                    ? "bg-sage-soft text-sage"
                    : "bg-paper text-ink-muted"
                }`}
              >
                {habit.streak > 0 ? `${habit.streak} day streak` : "no streak"}
              </span>
            </div>

            <div className="mt-5 flex justify-between">
              {habit.pattern.map((done, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="font-mono text-[10px] text-ink-muted">
                    {days[i]}
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      done ? "bg-sage" : "border border-line"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-ink-muted transition-colors hover:border-clay hover:text-clay"
        >
          <span className="text-xl leading-none">+</span>
          <span className="text-sm">New habit</span>
        </button>
      </div>
    </main>
  );
}
