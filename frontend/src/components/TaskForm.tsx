"use client";

import { useState } from "react";
import { CardForm } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

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
    <CardForm onSubmit={submit} padding="sm" className="flex flex-col gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        aria-label="Task title"
        autoFocus={autoFocus}
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Notes (optional)"
        aria-label="Description"
        rows={2}
        className="resize-none"
      />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-ink-muted">
          Est
          <Input
            type="number"
            min={1}
            value={estimateMinutes}
            onChange={(e) => setEstimate(e.target.value)}
            placeholder="min"
            aria-label="Estimate minutes"
            className="w-16"
          />
        </label>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-muted">
          Due
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
          />
        </label>
      </div>
      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || !title.trim()}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </CardForm>
  );
}
