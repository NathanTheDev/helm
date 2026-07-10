"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  completeHabit,
  uncompleteHabit,
  type Habit,
} from "@/lib/api";

const dayLetters = ["S", "M", "T", "W", "T", "F", "S"];

function dayLetter(date: string): string {
  return dayLetters[new Date(`${date}T00:00:00`).getDay()];
}

export function HabitCard({ habit }: { habit: Habit }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isCountable = habit.quantity > 1;

  const run = (action: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch {
        // Error states land in Phase 6; keep the current view on failure.
      }
    });
  };

  const toggleBoolean = () =>
    run(() =>
      habit.isCompletedToday
        ? uncompleteHabit(habit.id)
        : completeHabit(habit.id),
    );

  const increment = () =>
    run(() =>
      completeHabit(habit.id, Math.min(habit.todayProgress + 1, habit.quantity)),
    );

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-5">
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
          <div key={day.date} className="flex flex-col items-center gap-1.5">
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

      <div className="mt-5 flex items-center gap-3">
        {isCountable ? (
          <>
            <span className="font-mono text-xs text-ink-muted">
              {Math.min(habit.todayProgress, habit.quantity)} / {habit.quantity}
            </span>
            <button
              type="button"
              onClick={increment}
              disabled={pending || habit.isCompletedToday}
              className={`ml-auto rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                habit.isCompletedToday
                  ? "bg-sage-soft text-sage"
                  : "bg-clay-soft/60 text-clay hover:bg-clay-soft"
              }`}
            >
              {habit.isCompletedToday ? "Done ✓" : "+1"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggleBoolean}
            disabled={pending}
            className={`w-full rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              habit.isCompletedToday
                ? "bg-sage-soft text-sage hover:bg-sage-soft/70"
                : "bg-clay-soft/60 text-clay hover:bg-clay-soft"
            }`}
          >
            {habit.isCompletedToday ? "Done today ✓" : "Mark done"}
          </button>
        )}
      </div>
    </div>
  );
}
