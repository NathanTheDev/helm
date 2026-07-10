"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createHabit } from "@/lib/api";

type Frequency = "DAILY" | "WEEKLY";

export function NewHabitForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("DAILY");
  const [quantity, setQuantity] = useState(1);

  const reset = () => {
    setName("");
    setEmoji("");
    setFrequency("DAILY");
    setQuantity(1);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        await createHabit({
          name: trimmed,
          emoji: emoji.trim() || undefined,
          frequency,
          quantity: Math.max(1, quantity),
        });
        close();
        router.refresh();
      } catch {
        // Error surfacing lands in Phase 6.
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-ink-muted transition-colors hover:border-clay hover:text-clay"
      >
        <span className="text-xl leading-none">+</span>
        <span className="text-sm">New habit</span>
      </button>
    );
  }

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
          autoFocus
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
          onClick={close}
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
          {pending ? "Adding…" : "Add habit"}
        </button>
      </div>
    </form>
  );
}
