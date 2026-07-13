import { apiUrl, authHeaders } from "./api";

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  published: boolean;
  shareToken: string | null;
  externalDocId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getNotes(): Promise<Note[]> {
  const res = await fetch(apiUrl("/api/notes"), {
    cache: "no-store",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load notes: ${res.status}`);
  return res.json();
}

export async function getNote(id: string): Promise<Note> {
  const res = await fetch(apiUrl(`/api/notes/${id}`), {
    cache: "no-store",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load note: ${res.status}`);
  return res.json();
}

export interface NewNoteInput {
  title?: string;
  content?: string;
}

export async function createNote(input: NewNoteInput = {}): Promise<Note> {
  const res = await fetch(apiUrl("/api/notes"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create note: ${res.status}`);
  return res.json();
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  const res = await fetch(apiUrl(`/api/notes/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update note: ${res.status}`);
  return res.json();
}

export async function publishNote(id: string): Promise<Note> {
  const res = await fetch(apiUrl(`/api/notes/${id}/publish`), {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to publish note: ${res.status}`);
  return res.json();
}

export async function closeNote(id: string): Promise<Note> {
  const res = await fetch(apiUrl(`/api/notes/${id}/close`), {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to close note: ${res.status}`);
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/notes/${id}`), {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete note: ${res.status}`);
}
