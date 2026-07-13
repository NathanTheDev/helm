"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getProject,
  getProjectTasks,
  type Project,
  type Task,
} from "@/lib/tasksApi";
import { RememberProject } from "@/components/RememberProject";
import { Board } from "@/components/Board";

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Resets loading/error state when navigating between projects (same
    // page component instance, different projectId) - unavoidable as a
    // synchronous effect-body setState here since there's no natural key to
    // remount by instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setFailed(false);

    Promise.all([getProject(projectId), getProjectTasks(projectId)])
      .then(([loadedProject, loadedTasks]) => {
        if (cancelled) return;
        setProject(loadedProject);
        setTasks(loadedTasks);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) return null;

  if (failed || !project) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
        <Link
          href="/projects"
          className="w-fit text-sm text-ink-muted transition-colors hover:text-ink"
        >
          ← All projects
        </Link>
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink">Couldn&rsquo;t load this project.</p>
          <p className="mt-1 text-sm text-ink-muted">
            It may not exist, or the backend is unreachable.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <RememberProject projectId={project.id} />

      <Link
        href="/projects"
        className="w-fit text-sm text-ink-muted transition-colors hover:text-ink"
      >
        ← All projects
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: project.color ?? "#726b60" }}
          aria-hidden
        />
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          {project.name}
        </h1>
      </div>

      <div className="mt-10">
        <Board projectId={project.id} tasks={tasks} />
      </div>
    </main>
  );
}
