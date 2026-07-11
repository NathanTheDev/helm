"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  startTimer,
  stopTimer,
  formatClock,
  formatDuration,
  type Task,
} from "@/lib/tasksApi";

export function TaskTimer({ task }: { task: Task }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const running = !!task.runningSince;

  // null until mounted → no hydration mismatch; ticks only while running.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    if (!running) {
      setNowMs(null);
      return;
    }
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const liveElapsed =
    running && task.runningSince && nowMs
      ? Math.max(
          0,
          Math.floor((nowMs - new Date(task.runningSince).getTime()) / 1000),
        )
      : 0;
  const total = task.totalSeconds + liveElapsed;

  const toggle = () =>
    startTransition(async () => {
      try {
        await (running ? stopTimer(task.id) : startTimer(task.id));
        router.refresh();
      } catch {
        /* Phase 7 error surfacing */
      }
    });

  const estSeconds = task.estimateMinutes ? task.estimateMinutes * 60 : 0;
  const pct = estSeconds ? Math.min(100, Math.round((total / estSeconds) * 100)) : 0;
  const over = estSeconds > 0 && total > estSeconds;

  return (
    <div className="mt-3 pl-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
            running
              ? "bg-clay text-paper hover:bg-clay/90"
              : "bg-clay-soft/60 text-clay hover:bg-clay-soft"
          }`}
        >
          {running ? "■ Stop" : "▶ Start"}
        </button>
        <span className="font-mono text-[11px] text-ink-muted">
          {running && (
            <span className="mr-1 text-clay">{formatClock(liveElapsed)}</span>
          )}
          {formatDuration(total)} tracked
        </span>
      </div>

      {estSeconds > 0 && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: over ? "#c9633e" : "#6f7d5c",
              }}
            />
          </div>
          <span className="mt-1 block font-mono text-[10px] text-ink-muted">
            {formatDuration(total)} / {task.estimateMinutes}m
            {over ? " (over)" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
