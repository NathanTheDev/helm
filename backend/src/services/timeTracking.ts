import { addDays, toDateKey, toDayStart, toWeekStart } from "../utils/date";

export interface TimeEntryLike {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
}

function entrySeconds(entry: TimeEntryLike, now: Date): number {
  if (entry.endedAt) {
    return (
      entry.durationSeconds ??
      Math.round((entry.endedAt.getTime() - entry.startedAt.getTime()) / 1000)
    );
  }
  // Running entry: elapsed so far.
  return Math.max(0, Math.round((now.getTime() - entry.startedAt.getTime()) / 1000));
}

export interface TaskTotals {
  totalSeconds: number; // completed time only; client live-ticks the running bit
  runningEntryId: string | null;
  runningSince: Date | null;
}

// Per-task rollup used by serializeTask. Running time is surfaced via
// runningSince (not folded into totalSeconds) so the client can tick it live.
export function taskTotals(
  entries: TimeEntryLike[],
  _now: Date = new Date(),
): TaskTotals {
  let totalSeconds = 0;
  let runningEntryId: string | null = null;
  let runningSince: Date | null = null;

  for (const entry of entries) {
    if (entry.endedAt) {
      totalSeconds +=
        entry.durationSeconds ??
        Math.round((entry.endedAt.getTime() - entry.startedAt.getTime()) / 1000);
    } else {
      runningEntryId = entry.id;
      runningSince = entry.startedAt;
    }
  }

  return { totalSeconds, runningEntryId, runningSince };
}

export interface WorklogDay {
  date: string; // local YYYY-MM-DD
  seconds: number;
}

export interface Worklog {
  todaySeconds: number;
  weekSeconds: number;
  totalSeconds: number;
  last7Days: WorklogDay[]; // oldest → newest, always 7 entries
  days: WorklogDay[]; // every day with tracked time, newest → oldest
}

// Buckets entries by the local day of their startedAt (mirrors streak.ts's
// Map-by-day style). A running entry contributes its elapsed-so-far.
export function worklog(
  entries: TimeEntryLike[],
  now: Date = new Date(),
): Worklog {
  const byDay = new Map<string, number>();
  for (const entry of entries) {
    const key = toDateKey(toDayStart(entry.startedAt));
    byDay.set(key, (byDay.get(key) ?? 0) + entrySeconds(entry, now));
  }

  const today = toDayStart(now);
  const last7Days: WorklogDay[] = Array.from({ length: 7 }, (_, i) => {
    const key = toDateKey(addDays(today, i - 6));
    return { date: key, seconds: byDay.get(key) ?? 0 };
  });

  const weekStart = toWeekStart(today);
  let weekSeconds = 0;
  for (let i = 0; i < 7; i++) {
    weekSeconds += byDay.get(toDateKey(addDays(weekStart, i))) ?? 0;
  }

  const days = [...byDay.entries()]
    .map(([date, seconds]) => ({ date, seconds }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    todaySeconds: byDay.get(toDateKey(today)) ?? 0,
    weekSeconds,
    totalSeconds: [...byDay.values()].reduce((a, b) => a + b, 0),
    last7Days,
    days,
  };
}
