"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSubTask,
  updateSubTask,
  deleteSubTask,
  type Task,
} from "@/lib/tasksApi";

export function SubTaskEditor({ task }: { task: Task }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch {
        /* ignore */
      }
    });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    run(async () => {
      await createSubTask(task.id, t);
      setTitle("");
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        Sub-tasks
      </span>

      {task.subTasks.map((sub) => (
        <div key={sub.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={sub.done}
            disabled={pending}
            onChange={() => run(() => updateSubTask(sub.id, { done: !sub.done }))}
            aria-label={`Toggle ${sub.title}`}
            className="accent-sage"
          />
          <span
            className={`flex-1 text-sm ${
              sub.done ? "text-ink-muted line-through" : "text-ink"
            }`}
          >
            {sub.title}
          </span>
          <button
            type="button"
            onClick={() => run(() => deleteSubTask(sub.id))}
            disabled={pending}
            aria-label={`Delete ${sub.title}`}
            className="text-ink-muted transition-colors hover:text-clay disabled:opacity-50"
          >
            ×
          </button>
        </div>
      ))}

      <form onSubmit={add} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add sub-task"
          aria-label="Add sub-task"
          className="flex-1 rounded-lg border border-line bg-paper px-2 py-1 text-xs text-ink outline-none focus:border-clay"
        />
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="rounded-full bg-clay-soft/60 px-3 py-1 text-xs font-medium text-clay transition-colors hover:bg-clay-soft disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
