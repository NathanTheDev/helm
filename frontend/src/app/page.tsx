"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getHabits } from "@/lib/api";
import { getProjects, getProjectTasks } from "@/lib/tasksApi";
import { getNotes } from "@/lib/notesApi";
import { getCalendarEvents, type CalendarEvent } from "@/lib/calendarApi";
import { useAuth } from "@/lib/auth-context";
import { cardClasses } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarWidget } from "@/components/CalendarWidget";

const actions = [
  {
    href: "/notes/new",
    label: "New note",
    hint: "Start writing",
    tint: "bg-clay-soft text-clay",
    icon: (
      <path
        d="M4 20.5v-3.6L15.4 5.5a1.5 1.5 0 0 1 2.1 0l1.6 1.6a1.5 1.5 0 0 1 0 2.1L7.7 20.6H4Z"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/habits",
    label: "Habits",
    hint: "—",
    tint: "bg-sage-soft text-sage",
    icon: (
      <>
        <path d="M9 12.5l2 2 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="8.5" />
      </>
    ),
  },
  {
    href: "/projects",
    label: "Projects",
    hint: "—",
    tint: "bg-slate-soft text-slate",
    icon: (
      <>
        <rect x="4" y="5" width="4.5" height="14" rx="1.2" />
        <rect x="9.75" y="5" width="4.5" height="9" rx="1.2" />
        <rect x="15.5" y="5" width="4.5" height="11" rx="1.2" />
      </>
    ),
  },
  {
    href: "/tables",
    label: "Tables",
    hint: "Your own data",
    tint: "bg-plum-soft text-plum",
    icon: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
        <path d="M3.5 9.5h17M9 9.5V19.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "#at-a-glance",
    label: "At a glance",
    hint: "Jump to updates",
    tint: "bg-ochre-soft text-ochre",
    icon: (
      <path
        d="M12 4.5c-2.5 0-4.3 1.9-4.3 4.5v2.6c0 .7-.3 1.4-.8 1.9l-.9.9c-.5.5-.2 1.4.5 1.4h11c.7 0 1-.9.5-1.4l-.9-.9a2.7 2.7 0 0 1-.8-1.9V9c0-2.6-1.8-4.5-4.3-4.5Z M10.2 19a1.9 1.9 0 0 0 3.6 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

type GlanceItem = { kind: string; text: string; time: string };

function formatRelative(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const kindColor: Record<string, string> = {
  habit: "bg-sage",
  note: "bg-clay",
  project: "bg-slate",
};

export default function Home() {
  const { user } = useAuth();
  const [dueToday, setDueToday] = useState(0);
  const [openTasks, setOpenTasks] = useState(0);
  const [habitsGlance, setHabitsGlance] = useState<GlanceItem[]>([]);
  const [projectsGlance, setProjectsGlance] = useState<GlanceItem[]>([]);
  const [notesGlance, setNotesGlance] = useState<GlanceItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    getHabits()
      .then((habits) => {
        const due = habits.filter((h) => h.isDueToday && !h.isCompletedToday);
        setDueToday(due.length);

        const items: GlanceItem[] = [];
        if (due.length > 0) {
          items.push({
            kind: "habit",
            text: `${due.length} ${due.length === 1 ? "habit is" : "habits are"} due today`,
            time: "",
          });
        }
        const topStreak = [...habits].sort((a, b) => b.streak - a.streak)[0];
        if (topStreak && topStreak.streak > 0) {
          items.push({
            kind: "habit",
            text: `${topStreak.name} — ${topStreak.streak} day streak`,
            time: "",
          });
        }
        setHabitsGlance(items);
      })
      .catch(() => {
        setDueToday(0);
        setHabitsGlance([]);
      });

    getProjects()
      .then(async (projects) => {
        const active = projects.filter((p) => !p.archived);
        const taskLists = await Promise.all(active.map((p) => getProjectTasks(p.id)));
        const open = taskLists.flat().filter((t) => t.status !== "DONE").length;
        setOpenTasks(open);

        const items: GlanceItem[] = [];
        if (open > 0) {
          items.push({
            kind: "project",
            text: `${open} open ${open === 1 ? "task" : "tasks"} across ${active.length} ${
              active.length === 1 ? "project" : "projects"
            }`,
            time: "",
          });
        }
        setProjectsGlance(items);
      })
      .catch(() => {
        setOpenTasks(0);
        setProjectsGlance([]);
      });

    getNotes()
      .then((notes) => {
        const items: GlanceItem[] = [];

        if (notes.length > 0) {
          const stalest = [...notes].sort(
            (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
          )[0];
          items.push({
            kind: "note",
            text: `“${stalest.title || "Untitled note"}” hasn’t been touched in ${formatRelative(stalest.updatedAt)}`,
            time: formatRelative(stalest.updatedAt),
          });
        }

        const publishedCount = notes.filter((n) => n.published).length;
        if (publishedCount > 0) {
          items.push({
            kind: "note",
            text: `${publishedCount} ${publishedCount === 1 ? "note is" : "notes are"} published and shareable`,
            time: "",
          });
        }

        setNotesGlance(items);
      })
      .catch(() => setNotesGlance([]));

    getCalendarEvents()
      .then(setCalendarEvents)
      .catch(() => setCalendarEvents([]));
  }, []);

  const actionHint = (label: string, fallback: string) => {
    if (label === "Habits") return `${dueToday} due today`;
    if (label === "Projects") return `${openTasks} open`;
    if (label === "At a glance") return `${glance.length} ${glance.length === 1 ? "update" : "updates"}`;
    return fallback;
  };

  const glance = [...habitsGlance, ...projectsGlance, ...notesGlance];

  const firstName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const now = new Date();
  const dayLabel = now.toLocaleDateString(undefined, { weekday: "long" });
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-24">
      <section className="fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
          {dayLabel}
        </p>
        <h1 className="mt-3 font-display text-4xl italic text-ink sm:text-5xl">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-3 max-w-md text-ink-muted">
          Here&rsquo;s what&rsquo;s waiting for you.
        </p>
      </section>

      <section
        className="fade-up mt-10 flex flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-sm sm:flex-row"
        style={{ animationDelay: "80ms" }}
      >
        {actions.map((action, i) => (
          <Link
            key={action.label}
            href={action.href}
            className={`group flex flex-1 items-center gap-3 px-6 py-5 transition-colors hover:bg-clay-soft/40 ${
              i > 0 ? "border-t border-line sm:border-t-0 sm:border-l" : ""
            }`}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${action.tint}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                {action.icon}
              </svg>
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-ink">
                {action.label}
              </span>
              <span className="text-xs text-ink-muted">
                {actionHint(action.label, action.hint)}
              </span>
            </span>
          </Link>
        ))}
      </section>

      <section
        id="at-a-glance"
        className="fade-up mt-14 scroll-mt-24"
        style={{ animationDelay: "140ms" }}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-ink">At a glance</h2>
          <span className="font-mono text-xs text-ink-muted">
            {glance.length} items
          </span>
        </div>

        {glance.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="All caught up."
            description="Nothing new across your habits, projects, or notes."
          />
        ) : (
          <ul className={cardClasses({ padding: "none", className: "mt-4 divide-y divide-line overflow-hidden" })}>
            {glance.map((item) => (
              <li
                key={item.text}
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-paper/60"
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${kindColor[item.kind]}`}
                  aria-hidden
                />
                <span className="flex-1 text-sm text-ink">{item.text}</span>
                <span className="font-mono text-xs text-ink-muted">
                  {item.time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CalendarWidget events={calendarEvents} />
    </main>
  );
}
