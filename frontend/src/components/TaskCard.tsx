"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  deleteTask,
  updateTask,
  formatDuration,
  formatDueDate,
  type Task,
} from "@/lib/tasksApi";
import { TaskForm, type TaskFormValues } from "./TaskForm";

function toUpdateInput(v: TaskFormValues) {
  return {
    title: v.title.trim(),
    description: v.description.trim() || null,
    estimateMinutes: v.estimateMinutes ? Number(v.estimateMinutes) : null,
    dueDate: v.dueDate ? new Date(`${v.dueDate}T00:00:00`).toISOString() : null,
  };
}

export function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: editing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const run = (action: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch {
        /* error surfacing handled elsewhere (Phase 7) */
      }
    });

  const saveEdit = (v: TaskFormValues) =>
    run(async () => {
      await updateTask(task.id, toUpdateInput(v));
      setEditing(false);
    });

  const remove = () => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    run(() => deleteTask(task.id));
  };

  if (editing) {
    return (
      <div ref={setNodeRef} style={style}>
        <TaskForm
          initial={{
            title: task.title,
            description: task.description ?? "",
            estimateMinutes: task.estimateMinutes?.toString() ?? "",
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
          }}
          submitLabel="Save"
          pending={pending}
          onSubmit={saveEdit}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const doneSubs = task.subTasks.filter((s) => s.done).length;
  const overdue =
    task.dueDate && task.status !== "DONE"
      ? new Date(task.dueDate) < new Date(new Date().toDateString())
      : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-2xl border border-line bg-surface p-4"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Drag task"
          className="mt-0.5 cursor-grab touch-none text-ink-muted/60 transition-colors hover:text-ink-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>

        <h3 className="min-w-0 flex-1 text-sm font-medium text-ink">
          {task.title}
        </h3>

        <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={pending}
            aria-label="Edit task"
            className="text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Delete task"
            className="text-ink-muted transition-colors hover:text-clay disabled:opacity-50"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-6">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 font-mono text-[11px] text-ink-muted">
        {task.totalSeconds > 0 && <span>⏱ {formatDuration(task.totalSeconds)}</span>}
        {task.runningSince && <span className="text-clay">● running</span>}
        {task.subTasks.length > 0 && (
          <span>
            ☑ {doneSubs}/{task.subTasks.length}
          </span>
        )}
        {task.dueDate && (
          <span className={overdue ? "text-clay" : ""}>
            ◷ {formatDueDate(task.dueDate)}
          </span>
        )}
        {task.estimateMinutes && <span>~{task.estimateMinutes}m est</span>}
      </div>
    </div>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path d="M4 20.5v-3.6L15.4 5.5a1.5 1.5 0 0 1 2.1 0l1.6 1.6a1.5 1.5 0 0 1 0 2.1L7.7 20.6H4Z" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path d="M5 7h14M10 7V5.5A1.5 1.5 0 0 1 11.5 4h1A1.5 1.5 0 0 1 14 5.5V7m-7 0 .8 11a1.5 1.5 0 0 0 1.5 1.4h3.4a1.5 1.5 0 0 0 1.5-1.4L17 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
