import { apiUrl, authHeaders } from "./api";

export interface ObsidianConnectionStatus {
  connected: boolean;
  baseUrl: string | null;
  status: "UNVERIFIED" | "CONNECTED" | "ERROR";
  lastError: string | null;
  lastCheckedAt: string | null;
}

export async function getObsidianConnectionStatus(): Promise<ObsidianConnectionStatus> {
  const res = await fetch(apiUrl("/api/obsidian/connection"), {
    cache: "no-store",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load Obsidian connection status: ${res.status}`);
  }
  return res.json();
}

export interface SaveObsidianConnectionInput {
  baseUrl: string;
  apiKey: string;
}

export async function saveObsidianConnection(
  input: SaveObsidianConnectionInput,
): Promise<ObsidianConnectionStatus> {
  const res = await fetch(apiUrl("/api/obsidian/connection"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Failed to save Obsidian connection: ${res.status}`);
  }
  return res.json();
}

export async function testObsidianConnection(): Promise<ObsidianConnectionStatus> {
  const res = await fetch(apiUrl("/api/obsidian/connection/test"), {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to test Obsidian connection: ${res.status}`);
  }
  return res.json();
}

export async function disconnectObsidian(): Promise<void> {
  const res = await fetch(apiUrl("/api/obsidian/connection"), {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to disconnect Obsidian: ${res.status}`);
  }
}
