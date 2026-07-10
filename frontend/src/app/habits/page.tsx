import Link from "next/link";
import { getHabits, type Habit } from "@/lib/api";
import { HabitCard } from "@/components/HabitCard";
import { NewHabitForm } from "@/components/NewHabitForm";

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
          <HabitCard key={habit.id} habit={habit} />
        ))}

        <NewHabitForm />
      </div>
    </main>
  );
}
