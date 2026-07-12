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

export async function getWorklog(): Promise<Worklog> {
  const res = await fetch(apiUrl("/api/worklog"), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load worklog: ${res.status}`);
  return res.json();
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

// ---- timer ----

export async function startTimer(taskId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/tasks/${taskId}/timer/start`), {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to start timer: ${res.status}`);
}

export async function stopTimer(taskId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/tasks/${taskId}/timer/stop`), {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to stop timer: ${res.status}`);
}

// ---- tags ----

export const TAG_COLORS = [
  "#c9633e",
  "#6f7d5c",
  "#4f6d7a",
  "#8a6d9e",
  "#b08a3e",
];

export async function getTags(): Promise<Tag[]> {
  const res = await fetch(apiUrl("/api/tags"), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load tags: ${res.status}`);
  return res.json();
}

export async function createTag(input: {
  name: string;
  color: string;
}): Promise<Tag> {
  const res = await fetch(apiUrl("/api/tags"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create tag: ${res.status}`);
  return res.json();
}

export async function attachTag(taskId: string, tagId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/tasks/${taskId}/tags/${tagId}`), {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to attach tag: ${res.status}`);
}

export async function detachTag(taskId: string, tagId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/tasks/${taskId}/tags/${tagId}`), {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to detach tag: ${res.status}`);
}

// ---- sub-tasks ----

export async function createSubTask(
  taskId: string,
  title: string,
): Promise<SubTask> {
  const res = await fetch(apiUrl(`/api/tasks/${taskId}/subtasks`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to create sub-task: ${res.status}`);
  return res.json();
}

export async function updateSubTask(
  id: string,
  input: { title?: string; done?: boolean; position?: number },
): Promise<SubTask> {
  const res = await fetch(apiUrl(`/api/subtasks/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update sub-task: ${res.status}`);
  return res.json();
}

export async function deleteSubTask(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/subtasks/${id}`), { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete sub-task: ${res.status}`);
}

// ---- formatting helpers ----

export function formatClock(seconds: number): string {
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
}

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
