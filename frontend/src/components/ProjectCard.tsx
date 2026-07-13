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
import { Card, CardForm } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PencilIcon, ArchiveIcon, TrashIcon } from "@/components/ui/Icon";

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
      <CardForm onSubmit={saveEdit} className="flex flex-col gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Project name"
          autoFocus
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
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={pending || !name.trim()}>
            Save
          </Button>
        </div>
      </CardForm>
    );
  }

  return (
    <Card className={`flex flex-col ${project.archived ? "opacity-60" : ""}`}>
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
          {project.archived && <Badge size="xs">archived</Badge>}
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <IconButton onClick={() => setEditing(true)} disabled={pending} aria-label="Edit project">
            <PencilIcon />
          </IconButton>
          <IconButton
            onClick={toggleArchive}
            disabled={pending}
            aria-label={project.archived ? "Unarchive project" : "Archive project"}
          >
            <ArchiveIcon />
          </IconButton>
          <IconButton tone="danger" onClick={remove} disabled={pending} aria-label="Delete project">
            <TrashIcon />
          </IconButton>
        </div>
      </div>

      <Link
        href={`/projects/${project.id}`}
        className="mt-4 font-mono text-xs text-ink-muted transition-colors hover:text-ink"
      >
        {taskCount ?? 0} {taskCount === 1 ? "task" : "tasks"} →
      </Link>
    </Card>
  );
}
