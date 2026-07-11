import { apiUrl } from "./api";

export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";

export const STATUS_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "BACKLOG", label: "Backlog" },
  { status: "TODO", label: "Todo" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
];

export interface Project {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  archived: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface SubTask {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
  position: number;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  estimateMinutes: number | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  // computed by the backend serializer
  totalSeconds: number;
  runningEntryId: string | null;
  runningSince: string | null;
  tags: Tag[];
  subTasks: SubTask[];
}

export interface WorklogDay {
  date: string;
  seconds: number;
}

export interface Worklog {
  todaySeconds: number;
  weekSeconds: number;
  totalSeconds: number;
  last7Days: WorklogDay[];
  days: WorklogDay[];
}

// ---- reads ----

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(apiUrl("/api/projects"), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load projects: ${res.status}`);
  return res.json();
}

export async function getProject(id: string): Promise<Project> {
  const res = await fetch(apiUrl(`/api/projects/${id}`), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load project: ${res.status}`);
  return res.json();
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const res = await fetch(apiUrl(`/api/projects/${projectId}/tasks`), {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load tasks: ${res.status}`);
  return res.json();
}

// ---- project mutations ----

export interface NewProjectInput {
  name: string;
  color?: string;
}

export async function createProject(input: NewProjectInput): Promise<Project> {
  const res = await fetch(apiUrl("/api/projects"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create project: ${res.status}`);
  return res.json();
}

export async function updateProject(
  id: string,
  input: { name?: string; color?: string | null; archived?: boolean },
): Promise<Project> {
  const res = await fetch(apiUrl(`/api/projects/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update project: ${res.status}`);
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/projects/${id}`), { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete project: ${res.status}`);
}

// ---- task mutations ----

export interface NewTaskInput {
  title: string;
  status?: TaskStatus;
  description?: string;
  estimateMinutes?: number;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  position?: number;
  estimateMinutes?: number | null;
  dueDate?: string | null;
}

export async function createTask(
  projectId: string,
  input: NewTaskInput,
): Promise<Task> {
  const res = await fetch(apiUrl(`/api/projects/${projectId}/tasks`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create task: ${res.status}`);
  return res.json();
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const res = await fetch(apiUrl(`/api/tasks/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update task: ${res.status}`);
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/tasks/${id}`), { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete task: ${res.status}`);
}

// ---- formatting helpers ----

export function formatDuration(seconds: number): string {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export const LAST_PROJECT_KEY = "helm:lastProjectId";
