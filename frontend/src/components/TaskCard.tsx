"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  deleteTask,
  updateTask,
  formatDueDate,
  type Task,
} from "@/lib/tasksApi";
import { TaskForm, type TaskFormValues } from "./TaskForm";
import { TaskTimer } from "./TaskTimer";
import { TagPicker } from "./TagPicker";
import { SubTaskEditor } from "./SubTaskEditor";
import { cardClasses } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/Button";
import { GripIcon, PencilIcon, TrashIcon } from "@/components/ui/Icon";

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
      <div ref={setNodeRef} style={style} className="flex flex-col gap-2">
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
        <div className={cardClasses("default", "sm", "flex flex-col gap-4")}>
          <TagPicker task={task} />
          <SubTaskEditor task={task} />
        </div>
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
      className={cardClasses("default", "sm", "group")}
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
          <IconButton onClick={() => setEditing(true)} disabled={pending} aria-label="Edit task">
            <PencilIcon />
          </IconButton>
          <IconButton tone="danger" onClick={remove} disabled={pending} aria-label="Delete task">
            <TrashIcon />
          </IconButton>
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

      <TaskTimer task={task} />

      {(task.subTasks.length > 0 || task.dueDate) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 font-mono text-[11px] text-ink-muted">
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
        </div>
      )}
    </div>
  );
}
