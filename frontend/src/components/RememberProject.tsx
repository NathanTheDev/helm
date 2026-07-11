"use client";

import { useEffect } from "react";
import { LAST_PROJECT_KEY } from "@/lib/tasksApi";

// Records the currently-viewed project as "last opened" for JumpBackIn.
export function RememberProject({ projectId }: { projectId: string }) {
  useEffect(() => {
    localStorage.setItem(LAST_PROJECT_KEY, projectId);
  }, [projectId]);
  return null;
}
