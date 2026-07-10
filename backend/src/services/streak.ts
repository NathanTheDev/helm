import { addDays, toDateKey, toDayStart, toWeekStart } from "../utils/date";

export interface StreakCompletion {
  completedAt: Date;
  quantityProgress: number | null;
}

export interface StreakHabit {
  frequency: string;
  quantity: number;
}

export interface HabitStats {
  streak: number;
  isCompletedToday: boolean;
  isDueToday: boolean;
  todayProgress: number;
  last7Days: { date: string; completed: boolean }[];
}

function isQualifying(
  habit: StreakHabit,
  completion: StreakCompletion | undefined,
): boolean {
  if (!completion) return false;
  if (habit.quantity <= 1) return true;
  return (completion.quantityProgress ?? 0) >= habit.quantity;
}

function weekHasCompletion(
  habit: StreakHabit,
  byDay: Map<number, StreakCompletion>,
  weekStart: Date,
): boolean {
  for (let i = 0; i < 7; i++) {
    if (isQualifying(habit, byDay.get(addDays(weekStart, i).getTime()))) {
      return true;
    }
  }
  return false;
}

export function computeHabitStats(
  habit: StreakHabit,
  completions: StreakCompletion[],
  now: Date = new Date(),
): HabitStats {
  const byDay = new Map<number, StreakCompletion>();
  for (const completion of completions) {
    byDay.set(toDayStart(completion.completedAt).getTime(), completion);
  }

  const today = toDayStart(now);
  const todayCompletion = byDay.get(today.getTime());
  const isCompletedToday = isQualifying(habit, todayCompletion);
  const todayProgress =
    habit.quantity <= 1
      ? todayCompletion
        ? 1
        : 0
      : todayCompletion?.quantityProgress ?? 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    return {
      date: toDateKey(date),
      completed: isQualifying(habit, byDay.get(date.getTime())),
    };
  });

  if (habit.frequency === "WEEKLY") {
    const currentWeekStart = toWeekStart(today);
    const currentWeekSatisfied = weekHasCompletion(
      habit,
      byDay,
      currentWeekStart,
    );

    let cursor = currentWeekSatisfied
      ? currentWeekStart
      : addDays(currentWeekStart, -7);
    let streak = 0;
    while (weekHasCompletion(habit, byDay, cursor)) {
      streak += 1;
      cursor = addDays(cursor, -7);
    }

    return {
      streak,
      isCompletedToday,
      isDueToday: !currentWeekSatisfied,
      todayProgress,
      last7Days,
    };
  }

  let cursor = isCompletedToday ? today : addDays(today, -1);
  let streak = 0;
  while (isQualifying(habit, byDay.get(cursor.getTime()))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return { streak, isCompletedToday, isDueToday: true, todayProgress, last7Days };
}
