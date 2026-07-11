"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LAST_PROJECT_KEY, type Project } from "@/lib/tasksApi";

// Suggests the last-opened project (from localStorage), if it still exists.
export function JumpBackIn({ projects }: { projects: Project[] }) {
  const [lastId, setLastId] = useState<string | null>(null);

  useEffect(() => {
    setLastId(localStorage.getItem(LAST_PROJECT_KEY));
  }, []);

  const project = lastId ? projects.find((p) => p.id === lastId) : undefined;
  if (!project) return null;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink-muted transition-colors hover:border-clay hover:text-clay"
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: project.color ?? "#726b60" }}
        aria-hidden
      />
      Jump back into <span className="font-medium text-ink">{project.name}</span>
    </Link>
  );
}
