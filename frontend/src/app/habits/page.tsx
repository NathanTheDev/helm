import Link from "next/link";
import { getHabits, type Habit } from "@/lib/api";

const dayLetters = ["S", "M", "T", "W", "T", "F", "S"];

function dayLetter(date: string): string {
  return dayLetters[new Date(`${date}T00:00:00`).getDay()];
}

export default async function HabitsPage() {
  let habits: Habit[] = [];
  try {
    habits = await getHabits();
  } catch {
    habits = [];
  }

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
            key={habit.id}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
                {habit.emoji && (
                  <span className="text-base leading-none">{habit.emoji}</span>
                )}
                {habit.name}
              </h2>
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
              {habit.last7Days.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span className="font-mono text-[10px] text-ink-muted">
                    {dayLetter(day.date)}
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      day.completed ? "bg-sage" : "border border-line"
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
