"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  completeHabit,
  deleteHabit,
  uncompleteHabit,
  updateHabit,
  type Habit,
} from "@/lib/api";

type Frequency = "DAILY" | "WEEKLY";

const dayLetters = ["S", "M", "T", "W", "T", "F", "S"];

function dayLetter(date: string): string {
  return dayLetters[new Date(`${date}T00:00:00`).getDay()];
}

export function HabitCard({ habit }: { habit: Habit }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const isCountable = habit.quantity > 1;

  const run = (action: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch {
        // Error states beyond keeping the current view land in Phase 6 fetch scope.
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

  const remove = () => {
    if (!confirm(`Delete "${habit.name}"? This can't be undone.`)) return;
    run(() => deleteHabit(habit.id));
  };

  if (editing) {
    return (
      <EditHabit
        habit={habit}
        onDone={() => {
          setEditing(false);
          router.refresh();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
          {habit.emoji && (
            <span className="text-base leading-none">{habit.emoji}</span>
          )}
          <span className="truncate">{habit.name}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${
              habit.streak > 0
                ? "bg-sage-soft text-sage"
                : "bg-paper text-ink-muted"
            }`}
          >
            {habit.streak > 0 ? `${habit.streak} day streak` : "no streak"}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={pending}
            aria-label="Edit habit"
            className="text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Delete habit"
            className="text-ink-muted transition-colors hover:text-clay disabled:opacity-50"
          >
            <TrashIcon />
          </button>
        </div>
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

function EditHabit({
  habit,
  onDone,
  onCancel,
}: {
  habit: Habit;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(habit.name);
  const [emoji, setEmoji] = useState(habit.emoji ?? "");
  const [frequency, setFrequency] = useState<Frequency>(habit.frequency);
  const [quantity, setQuantity] = useState(habit.quantity);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        await updateHabit(habit.id, {
          name: trimmed,
          emoji: emoji.trim() || undefined,
          frequency,
          quantity: Math.max(1, quantity),
        });
        onDone();
      } catch {
        // keep the form open on failure
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-2xl border border-clay bg-surface p-5"
    >
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="🙂"
          aria-label="Emoji"
          maxLength={2}
          className="w-12 shrink-0 rounded-lg border border-line bg-paper px-2 py-1.5 text-center text-sm text-ink outline-none focus:border-clay"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Habit name"
          aria-label="Habit name"
          className="flex-1 rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-clay"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-line">
          {(["DAILY", "WEEKLY"] as Frequency[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                frequency === f
                  ? "bg-clay-soft/60 text-clay"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {f === "DAILY" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>

        <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-muted">
          Target
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
            aria-label="Target per period"
            className="w-14 rounded-lg border border-line bg-paper px-2 py-1.5 text-center text-sm text-ink outline-none focus:border-clay"
          />
        </label>
      </div>

      <div className="mt-1 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="rounded-full bg-clay px-4 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-clay/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-3.5 w-3.5"
    >
      <path
        d="M4 20.5v-3.6L15.4 5.5a1.5 1.5 0 0 1 2.1 0l1.6 1.6a1.5 1.5 0 0 1 0 2.1L7.7 20.6H4Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-3.5 w-3.5"
    >
      <path
        d="M5 7h14M10 7V5.5A1.5 1.5 0 0 1 11.5 4h1A1.5 1.5 0 0 1 14 5.5V7m-7 0 .8 11a1.5 1.5 0 0 0 1.5 1.4h3.4a1.5 1.5 0 0 0 1.5-1.4L17 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
