import { apiUrl, authHeaders } from "./api";

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const res = await fetch(apiUrl("/api/calendar"), {
    cache: "no-store",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load calendar events: ${res.status}`);
  }
  const data = await res.json();
  return data.events;
}
