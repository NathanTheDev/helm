import { cardClasses } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { startGoogleCalendarConnect, type CalendarEvent } from "@/lib/calendarApi";

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function dayLabel(date: Date, now: Date): string {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function timeLabel(event: CalendarEvent): string {
  if (event.allDay) return "All day";
  return new Date(event.startsAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

async function handleConnect() {
  const url = await startGoogleCalendarConnect();
  window.location.href = url;
}

export function CalendarWidget({ events, connected }: { events: CalendarEvent[]; connected: boolean }) {
  const now = new Date();
  const upcoming = [...events]
    .filter((e) => new Date(e.endsAt) >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 5);

  return (
    <section className="fade-up mt-14" style={{ animationDelay: "200ms" }}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl text-ink">Coming up</h2>
        {connected && (
          <span className="font-mono text-xs text-ink-muted">
            {upcoming.length} {upcoming.length === 1 ? "event" : "events"}
          </span>
        )}
      </div>

      {!connected ? (
        <EmptyState
          className="mt-4"
          title="Connect your calendar to see what's coming up."
          action={
            <Button size="sm" onClick={handleConnect}>
              Connect Google Calendar
            </Button>
          }
        />
      ) : upcoming.length === 0 ? (
        <EmptyState className="mt-4" title="Nothing on your calendar." />
      ) : (
        <ul className={cardClasses({ padding: "none", className: "mt-4 divide-y divide-line overflow-hidden" })}>
          {upcoming.map((event) => (
            <li key={event.id} className="flex items-center gap-3 px-5 py-4">
              <span className="w-24 shrink-0 font-mono text-xs text-ink-muted">
                {dayLabel(new Date(event.startsAt), now)}
              </span>
              <span className="flex-1 text-sm text-ink">{event.title}</span>
              <span className="font-mono text-xs text-ink-muted">{timeLabel(event)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
