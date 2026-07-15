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
import { Card, CardForm } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PencilIcon, TrashIcon } from "@/components/ui/Icon";

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
    <Card interactive className="flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
          <span className="truncate">{habit.name}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={habit.streak > 0 ? "success" : "neutral"}>
            {habit.streak > 0 ? `${habit.streak} day streak` : "no streak"}
          </Badge>
          <IconButton onClick={() => setEditing(true)} disabled={pending} aria-label="Edit habit">
            <PencilIcon />
          </IconButton>
          <IconButton tone="danger" onClick={remove} disabled={pending} aria-label="Delete habit">
            <TrashIcon />
          </IconButton>
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
            <Button
              variant={habit.isCompletedToday ? "subtle-active" : "subtle"}
              size="xs"
              className="ml-auto"
              onClick={increment}
              disabled={pending || habit.isCompletedToday}
            >
              {habit.isCompletedToday ? "Done ✓" : "+1"}
            </Button>
          </>
        ) : (
          <Button
            variant={habit.isCompletedToday ? "subtle-active" : "subtle"}
            size="sm"
            className="w-full"
            onClick={toggleBoolean}
            disabled={pending}
          >
            {habit.isCompletedToday ? "Done today ✓" : "Mark done"}
          </Button>
        )}
      </div>
    </Card>
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
    <CardForm onSubmit={submit} className="flex flex-col gap-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Habit name"
        aria-label="Habit name"
      />

      <div className="flex items-center gap-2">
        <div className="flex overflow-hidden rounded-control border border-line">
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
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
            aria-label="Target per period"
            className="w-14 text-center"
          />
        </label>
      </div>

      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || !name.trim()}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </CardForm>
  );
}
