"use client";

import { useState } from "react";

export interface TaskFormValues {
  title: string;
  description: string;
  estimateMinutes: string; // raw form value
  dueDate: string; // yyyy-mm-dd or ""
}

export function TaskForm({
  initial,
  submitLabel,
  pending,
  autoFocus = true,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<TaskFormValues>;
  submitLabel: string;
  pending: boolean;
  autoFocus?: boolean;
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [estimateMinutes, setEstimate] = useState(initial?.estimateMinutes ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, description, estimateMinutes, dueDate });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-2xl border border-clay bg-surface p-4"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        aria-label="Task title"
        autoFocus={autoFocus}
        className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-clay"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Notes (optional)"
        aria-label="Description"
        rows={2}
        className="resize-none rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-clay"
      />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-ink-muted">
          Est
          <input
            type="number"
            min={1}
            value={estimateMinutes}
            onChange={(e) => setEstimate(e.target.value)}
            placeholder="min"
            aria-label="Estimate minutes"
            className="w-16 rounded-lg border border-line bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-clay"
          />
        </label>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-muted">
          Due
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
            className="rounded-lg border border-line bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-clay"
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
          disabled={pending || !title.trim()}
          className="rounded-full bg-clay px-4 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-clay/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
