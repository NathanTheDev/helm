"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/tasksApi";

export const PROJECT_COLORS = [
  "#c9633e", // clay
  "#6f7d5c", // sage
  "#4f6d7a", // slate blue
  "#8a6d9e", // muted purple
  "#b08a3e", // ochre
];

export function NewProjectForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(PROJECT_COLORS[0]);

  const close = () => {
    setOpen(false);
    setName("");
    setColor(PROJECT_COLORS[0]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        await createProject({ name: trimmed, color });
        close();
        router.refresh();
      } catch {
        // error surfacing lands in Phase 7
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-ink-muted transition-colors hover:border-clay hover:text-clay"
      >
        <span className="text-xl leading-none">+</span>
        <span className="text-sm">New project</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-2xl border border-clay bg-surface p-5"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        aria-label="Project name"
        autoFocus
        className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-clay"
      />

      <div className="flex items-center gap-2">
        {PROJECT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Color ${c}`}
            style={{ backgroundColor: c }}
            className={`h-5 w-5 rounded-full transition-transform ${
              color === c ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""
            }`}
          />
        ))}
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
          {pending ? "Adding…" : "Add project"}
        </button>
      </div>
    </form>
  );
}
