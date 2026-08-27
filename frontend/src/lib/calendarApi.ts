import { apiUrl, authHeaders } from "./api";

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
}

export interface CalendarEventsResult {
  events: CalendarEvent[];
  connected: boolean;
}

export async function getCalendarEvents(): Promise<CalendarEventsResult> {
  const res = await fetch(apiUrl("/api/calendar"), {
    cache: "no-store",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load calendar events: ${res.status}`);
  }
  return res.json();
}

export async function startGoogleCalendarConnect(): Promise<string> {
  const res = await fetch(apiUrl("/api/calendar/oauth/start"), {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to start Google Calendar connect: ${res.status}`);
  }
  const data = await res.json();
  return data.url;
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const res = await fetch(apiUrl("/api/calendar/connection"), {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to disconnect Google Calendar: ${res.status}`);
  }
}
