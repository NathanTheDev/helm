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
  todayProgress: number;
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

export interface NewHabitInput {
  name: string;
  emoji?: string;
  frequency: "DAILY" | "WEEKLY";
  quantity: number;
}

export async function createHabit(input: NewHabitInput): Promise<Habit> {
  const res = await fetch(apiUrl("/api/habits"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Failed to create habit: ${res.status}`);
  }
  return res.json();
}

export async function updateHabit(
  habitId: string,
  input: Partial<NewHabitInput>,
): Promise<Habit> {
  const res = await fetch(apiUrl(`/api/habits/${habitId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Failed to update habit: ${res.status}`);
  }
  return res.json();
}

export async function deleteHabit(habitId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/habits/${habitId}`), {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete habit: ${res.status}`);
  }
}

// Mark today complete (boolean) or set today's progress (countable).
export async function completeHabit(
  habitId: string,
  quantityProgress?: number,
): Promise<void> {
  const res = await fetch(apiUrl(`/api/habits/${habitId}/completions`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quantityProgress ? { quantityProgress } : {}),
  });
  if (!res.ok) {
    throw new Error(`Failed to update habit: ${res.status}`);
  }
}

// Remove today's completion (un-mark). Sends a full timestamp so the
// backend resolves it to the current local day.
export async function uncompleteHabit(habitId: string): Promise<void> {
  const date = encodeURIComponent(new Date().toISOString());
  const res = await fetch(
    apiUrl(`/api/habits/${habitId}/completions?date=${date}`),
    { method: "DELETE" },
  );
  if (!res.ok) {
    throw new Error(`Failed to un-mark habit: ${res.status}`);
  }
}
