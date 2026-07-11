"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteProject,
  updateProject,
  type Project,
} from "@/lib/tasksApi";
import { PROJECT_COLORS } from "./NewProjectForm";

export function ProjectCard({
  project,
  taskCount,
}: {
  project: Project;
  taskCount?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color ?? PROJECT_COLORS[0]);

  const run = (action: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch {
        /* error surfacing lands in Phase 7 */
      }
    });

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    run(async () => {
      await updateProject(project.id, { name: trimmed, color });
      setEditing(false);
    });
  };

  const toggleArchive = () =>
    run(() => updateProject(project.id, { archived: !project.archived }));

  const remove = () => {
    if (
      !confirm(
        `Delete "${project.name}" and all its tasks? This can't be undone.`,
      )
    )
      return;
    run(() => deleteProject(project.id));
  };

  if (editing) {
    return (
      <form
        onSubmit={saveEdit}
        className="flex flex-col gap-3 rounded-2xl border border-clay bg-surface p-5"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
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
              className={`h-5 w-5 rounded-full ${
                color === c
                  ? "ring-2 ring-ink ring-offset-2 ring-offset-surface"
                  : ""
              }`}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
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
            Save
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border border-line bg-surface p-5 ${
        project.archived ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/projects/${project.id}`}
          className="group flex min-w-0 items-center gap-2"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: project.color ?? "#726b60" }}
            aria-hidden
          />
          <span className="truncate text-sm font-medium text-ink transition-colors group-hover:text-clay">
            {project.name}
          </span>
          {project.archived && (
            <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] text-ink-muted">
              archived
            </span>
          )}
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={pending}
            aria-label="Edit project"
            className="text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={toggleArchive}
            disabled={pending}
            aria-label={project.archived ? "Unarchive project" : "Archive project"}
            className="text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <ArchiveIcon />
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Delete project"
            className="text-ink-muted transition-colors hover:text-clay disabled:opacity-50"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <Link
        href={`/projects/${project.id}`}
        className="mt-4 font-mono text-xs text-ink-muted transition-colors hover:text-ink"
      >
        {taskCount ?? 0} {taskCount === 1 ? "task" : "tasks"} →
      </Link>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path d="M4 20.5v-3.6L15.4 5.5a1.5 1.5 0 0 1 2.1 0l1.6 1.6a1.5 1.5 0 0 1 0 2.1L7.7 20.6H4Z" strokeLinejoin="round" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path d="M4 7h16M5 7l.7 11a1.5 1.5 0 0 0 1.5 1.4h9.6a1.5 1.5 0 0 0 1.5-1.4L19 7M4 7l1.2-2.4A1.5 1.5 0 0 1 6.5 4h11a1.5 1.5 0 0 1 1.3.6L20 7M10 11h4" strokeLinecap="round" strokeLinejoin="round" />
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
