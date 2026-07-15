import { addDays, toDateKey, toDayStart } from "../utils/date";

export type StatsRange = "week" | "month" | "year" | "all";

export interface DailyRateHabit {
  id: string;
  quantity: number;
  createdAt: Date;
}

export interface DailyRateCompletion {
  habitId: string;
  completedAt: Date;
  quantityProgress: number | null;
}

export interface DailyRate {
  date: string;
  completed: number;
  total: number;
  percent: number;
}

const RANGE_DAYS: Record<Exclude<StatsRange, "all">, number> = {
  week: 7,
  month: 30,
  year: 365,
};

function isQualifying(
  habit: { quantity: number },
  completion: DailyRateCompletion | undefined,
): boolean {
  if (!completion) return false;
  if (habit.quantity <= 1) return true;
  return (completion.quantityProgress ?? 0) >= habit.quantity;
}

// Denominator per day is "habits that existed by that day" - WEEKLY habits are
// treated as due every day here too, since a day-by-day percentage chart has
// no clean way to represent a weekly habit's non-daily cadence.
export function computeDailyCompletionRates(
  habits: DailyRateHabit[],
  completions: DailyRateCompletion[],
  range: StatsRange,
  now: Date = new Date(),
): DailyRate[] {
  const today = toDayStart(now);

  let days: number;
  if (range === "all") {
    if (habits.length === 0) return [];
    const earliest = habits.reduce(
      (min, h) => (h.createdAt < min ? h.createdAt : min),
      habits[0].createdAt,
    );
    days =
      Math.max(
        0,
        Math.round((today.getTime() - toDayStart(earliest).getTime()) / 86_400_000),
      ) + 1;
  } else {
    days = RANGE_DAYS[range];
  }

  const byHabitDay = new Map<string, DailyRateCompletion>();
  for (const c of completions) {
    byHabitDay.set(`${c.habitId}:${toDayStart(c.completedAt).getTime()}`, c);
  }

  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - (days - 1));
    const dateMs = date.getTime();
    const activeHabits = habits.filter((h) => toDayStart(h.createdAt).getTime() <= dateMs);
    const completed = activeHabits.filter((h) =>
      isQualifying(h, byHabitDay.get(`${h.id}:${dateMs}`)),
    ).length;

    return {
      date: toDateKey(date),
      completed,
      total: activeHabits.length,
      percent: activeHabits.length > 0 ? Math.round((completed / activeHabits.length) * 100) : 0,
    };
  });
}
