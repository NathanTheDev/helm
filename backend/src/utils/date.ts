export function toDayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Local (not UTC) YYYY-MM-DD, so day labels don't shift a day in +/- offset zones.
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toWeekStart(date: Date): Date {
  const day = toDayStart(date);
  const daysSinceMonday = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - daysSinceMonday);
  return day;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
