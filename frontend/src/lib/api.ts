export interface HabitDay {
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  frequency: "DAILY" | "WEEKLY";
  quantity: number;
  emoji: string | null;
  createdAt: string;
  updatedAt: string;
  streak: number;
  isCompletedToday: boolean;
  isDueToday: boolean;
  last7Days: HabitDay[];
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export async function getHabits(): Promise<Habit[]> {
  const res = await fetch(apiUrl("/api/habits"), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load habits: ${res.status}`);
  }
  return res.json();
}
