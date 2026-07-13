"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProjects, getProjectTasks, type Project } from "@/lib/tasksApi";
import { ProjectCard } from "@/components/ProjectCard";
import { NewProjectForm } from "@/components/NewProjectForm";
import { JumpBackIn } from "@/components/JumpBackIn";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getProjects()
      .then(async (loaded) => {
        if (cancelled) return;
        setProjects(loaded);

        // Task counts per project (parallel; tolerate individual failures).
        if (loaded.length) {
          const results = await Promise.allSettled(
            loaded.map((p) => getProjectTasks(p.id)),
          );
          if (cancelled) return;
          const next = new Map<string, number>();
          results.forEach((r, i) => {
            if (r.status === "fulfilled") next.set(loaded[i].id, r.value.length);
          });
          setCounts(next);
        }
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
  }, []);

  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);
  const ordered = [...active, ...archived];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <Link
        href="/"
        className="w-fit text-sm text-ink-muted transition-colors hover:text-ink"
      >
        ← Back home
      </Link>

      <div className="mt-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Projects</h1>
        <span className="font-mono text-xs text-ink-muted">
          {loading || failed ? "—" : `${active.length} active`}
        </span>
      </div>
      <p className="mt-2 max-w-md text-ink-muted">
        Each project is a board. Pick one to plan and track your work.
      </p>

      {loading ? null : failed ? (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink">Couldn&rsquo;t reach the server.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Make sure the backend is running, then refresh.
          </p>
        </div>
      ) : (
        <>
          <JumpBackIn projects={projects} />

          {projects.length === 0 && (
            <p className="mt-8 text-sm text-ink-muted">
              No projects yet — create your first one below.
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ordered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                taskCount={counts.get(project.id)}
              />
            ))}
            <NewProjectForm />
          </div>
        </>
      )}
    </main>
  );
}
