import Link from "next/link";
import { getHabits, type Habit } from "@/lib/api";
import { HabitCard } from "@/components/HabitCard";
import { NewHabitForm } from "@/components/NewHabitForm";

export default async function HabitsPage() {
  let habits: Habit[] = [];
  let failed = false;
  try {
    habits = await getHabits();
  } catch {
    failed = true;
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
          {failed ? "—" : `${habits.length} tracked`}
        </span>
      </div>
      <p className="mt-2 max-w-md text-ink-muted">
        A quiet place to keep the streaks you care about.
      </p>

      {failed ? (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink">Couldn&rsquo;t reach the server.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Make sure the backend is running, then refresh.
          </p>
        </div>
      ) : (
        <>
          {habits.length === 0 && (
            <p className="mt-10 text-sm text-ink-muted">
              No habits yet — add your first one below.
            </p>
          )}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
            <NewHabitForm />
          </div>
        </>
      )}
    </main>
  );
}
