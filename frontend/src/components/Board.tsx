"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  STATUS_COLUMNS,
  createTask,
  updateTask,
  type NewTaskInput,
  type Task,
  type TaskStatus,
} from "@/lib/tasksApi";
import { TaskCard } from "./TaskCard";
import { TaskForm, type TaskFormValues } from "./TaskForm";
import { Card, cardClasses } from "@/components/ui/Card";

type Columns = Record<TaskStatus, Task[]>;

function group(tasks: Task[]): Columns {
  const cols: Columns = { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const t of [...tasks].sort((a, b) => a.position - b.position)) {
    cols[t.status].push(t);
  }
  return cols;
}

// Position for the moved item sitting at `index` in `list` (which includes it).
function positionForIndex(list: Task[], index: number): number {
  const before = list[index - 1];
  const after = list[index + 1];
  if (before && after) return (before.position + after.position) / 2;
  if (before) return before.position + 1;
  if (after) return after.position - 1;
  return 1;
}

export function Board({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: Task[];
}) {
  const router = useRouter();
  const [columns, setColumns] = useState<Columns>(() => group(tasks));
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Reconcile optimistic state with server truth after each refresh.
  useEffect(() => {
    setColumns(group(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const findContainer = (id: UniqueIdentifier): TaskStatus | undefined => {
    if ((id as string) in columns) return id as TaskStatus;
    return (Object.keys(columns) as TaskStatus[]).find((s) =>
      columns[s].some((t) => t.id === id),
    );
  };

  const activeTask = activeId
    ? Object.values(columns)
        .flat()
        .find((t) => t.id === activeId) ?? null
    : null;

  const onDragStart = (e: DragStartEvent) => setActiveId(e.active.id);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (!from || !to) return;
    if (active.id === over.id && from === to) return;

    let persist: { status: TaskStatus; position: number } | null = null;

    setColumns((prev) => {
      const moving = prev[from].find((t) => t.id === active.id);
      if (!moving) return prev;

      const overIsColumn = (over.id as string) in prev;
      const sourceWithout = prev[from].filter((t) => t.id !== active.id);
      const base = from === to ? sourceWithout : prev[to];

      const index = overIsColumn
        ? base.length
        : (() => {
            const i = base.findIndex((t) => t.id === over.id);
            return i < 0 ? base.length : i;
          })();

      const nextTo = [...base];
      nextTo.splice(index, 0, { ...moving, status: to });
      persist = { status: to, position: positionForIndex(nextTo, index) };

      return from === to
        ? { ...prev, [to]: nextTo }
        : { ...prev, [from]: sourceWithout, [to]: nextTo };
    });

    if (persist) {
      const p: { status: TaskStatus; position: number } = persist;
      (async () => {
        try {
          await updateTask(active.id as string, p);
          router.refresh();
        } catch {
          router.refresh(); // revert to server truth on failure
        }
      })();
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {STATUS_COLUMNS.map(({ status, label }) => (
          <Column
            key={status}
            status={status}
            label={label}
            tasks={columns[status]}
            projectId={projectId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <Card variant="form" padding="sm" className="shadow-lg">
            <h3 className="text-sm font-medium text-ink">{activeTask.title}</h3>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  label,
  tasks,
  projectId,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  projectId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const addTask = (v: TaskFormValues) => {
    const input: NewTaskInput = { title: v.title.trim(), status };
    if (v.description.trim()) input.description = v.description.trim();
    if (v.estimateMinutes) input.estimateMinutes = Number(v.estimateMinutes);
    if (v.dueDate) input.dueDate = new Date(`${v.dueDate}T00:00:00`).toISOString();
    startTransition(async () => {
      try {
        await createTask(projectId, input);
        setAdding(false);
        router.refresh();
      } catch {
        /* Phase 7 error surfacing */
      }
    });
  };

  return (
    <section className="flex flex-col">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="text-sm font-medium text-ink">{label}</h2>
        <span className="font-mono text-xs text-ink-muted">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[48px] flex-col gap-3 rounded-2xl transition-colors ${
          isOver ? "bg-clay-soft/30" : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !adding && (
          <div
            className={cardClasses({
              variant: "dashed",
              padding: "none",
              shadow: "none",
              className: "px-4 py-6 text-center font-mono text-[11px] text-ink-muted",
            })}
          >
            empty
          </div>
        )}
      </div>

      {adding ? (
        <div className="mt-3">
          <TaskForm
            submitLabel="Add task"
            pending={pending}
            onSubmit={addTask}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={cardClasses({
            variant: "dashed",
            padding: "none",
            shadow: "none",
            className: "mt-3 px-4 py-2 text-xs text-ink-muted transition-colors hover:border-clay hover:text-clay",
          })}
        >
          + Add task
        </button>
      )}
    </section>
  );
}
