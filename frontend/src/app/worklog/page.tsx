import Link from "next/link";
import { getWorklog, formatDuration, type Worklog } from "@/lib/tasksApi";

const dayLetters = ["S", "M", "T", "W", "T", "F", "S"];
function dayLetter(date: string): string {
  return dayLetters[new Date(`${date}T00:00:00`).getDay()];
}

export default async function WorklogPage() {
  let worklog: Worklog | null = null;
  let failed = false;
  try {
    worklog = await getWorklog();
  } catch {
    failed = true;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <Link
        href="/"
        className="w-fit text-sm text-ink-muted transition-colors hover:text-ink"
      >
        ← Back home
      </Link>

      <div className="mt-6">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Worklog</h1>
      </div>
      <p className="mt-2 max-w-md text-ink-muted">
        Time you&rsquo;ve tracked across every project.
      </p>

      {failed ? (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink">Couldn&rsquo;t reach the server.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Make sure the backend is running, then refresh.
          </p>
        </div>
      ) : worklog && worklog.totalSeconds === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">
          No time tracked yet — start a timer on a task to see it here.
        </p>
      ) : (
        worklog && <WorklogContent worklog={worklog} />
      )}
    </main>
  );
}

function WorklogContent({ worklog }: { worklog: Worklog }) {
  const max = Math.max(1, ...worklog.last7Days.map((d) => d.seconds));

  return (
    <>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Today" seconds={worklog.todaySeconds} />
        <Stat label="This week" seconds={worklog.weekSeconds} />
        <Stat label="All time" seconds={worklog.totalSeconds} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-ink">Last 7 days</h2>
        <div className="mt-5 flex items-end justify-between gap-3 rounded-2xl border border-line bg-surface p-5">
          {worklog.last7Days.map((day) => {
            const h = Math.round((day.seconds / max) * 96);
            return (
              <div
                key={day.date}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="font-mono text-[10px] text-ink-muted">
                  {day.seconds > 0 ? formatDuration(day.seconds) : ""}
                </span>
                <div className="flex h-24 w-full items-end">
                  <div
                    className="w-full rounded-t bg-sage"
                    style={{ height: `${Math.max(day.seconds > 0 ? 3 : 0, h)}px` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-ink-muted">
                  {dayLetter(day.date)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {worklog.days.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl text-ink">By day</h2>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {worklog.days.map((day) => (
              <li
                key={day.date}
                className="flex items-center justify-between px-5 py-3"
              >
                <span className="font-mono text-xs text-ink-muted">
                  {day.date}
                </span>
                <span className="text-sm text-ink">
                  {formatDuration(day.seconds)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Stat({ label, seconds }: { label: string; seconds: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-ink">
        {formatDuration(seconds)}
      </p>
    </div>
  );
}
