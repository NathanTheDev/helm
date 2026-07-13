"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getHabits } from "@/lib/api";
import { getProjects, getProjectTasks } from "@/lib/tasksApi";
import { useAuth } from "@/lib/auth-context";

const actions = [
  {
    href: "/notes/new",
    label: "New note",
    hint: "Start writing",
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
    hint: "3 due today",
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
    hint: "0 open",
    icon: (
      <>
        <rect x="4" y="5" width="4.5" height="14" rx="1.2" />
        <rect x="9.75" y="5" width="4.5" height="9" rx="1.2" />
        <rect x="15.5" y="5" width="4.5" height="11" rx="1.2" />
      </>
    ),
  },
  {
    href: "#at-a-glance",
    label: "Notifications",
    hint: "5 new",
    icon: (
      <path
        d="M12 4.5c-2.5 0-4.3 1.9-4.3 4.5v2.6c0 .7-.3 1.4-.8 1.9l-.9.9c-.5.5-.2 1.4.5 1.4h11c.7 0 1-.9.5-1.4l-.9-.9a2.7 2.7 0 0 1-.8-1.9V9c0-2.6-1.8-4.5-4.3-4.5Z M10.2 19a1.9 1.9 0 0 0 3.6 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

const glance = [
  {
    kind: "habit",
    text: "Reading streak — 12 days running",
    time: "2h",
  },
  {
    kind: "note",
    text: "“Q3 planning” hasn’t been touched in a week",
    time: "5h",
  },
  {
    kind: "habit",
    text: "Morning walk — missed yesterday",
    time: "1d",
  },
  {
    kind: "note",
    text: "3 notes were shared with you",
    time: "2d",
  },
  {
    kind: "reminder",
    text: "Weekly review is due tomorrow",
    time: "2d",
  },
];

const kindColor: Record<string, string> = {
  habit: "bg-sage",
  note: "bg-clay",
  reminder: "bg-ink-muted",
};

export default function Home() {
  const { user } = useAuth();
  const [dueToday, setDueToday] = useState(0);
  const [openTasks, setOpenTasks] = useState(0);

  useEffect(() => {
    getHabits()
      .then((habits) => {
        setDueToday(habits.filter((h) => h.isDueToday && !h.isCompletedToday).length);
      })
      .catch(() => setDueToday(0));

    getProjects()
      .then(async (projects) => {
        const taskLists = await Promise.all(
          projects.filter((p) => !p.archived).map((p) => getProjectTasks(p.id)),
        );
        setOpenTasks(taskLists.flat().filter((t) => t.status !== "DONE").length);
      })
      .catch(() => setOpenTasks(0));
  }, []);

  const actionHint = (label: string, fallback: string) => {
    if (label === "Habits") return `${dueToday} due today`;
    if (label === "Projects") return `${openTasks} open`;
    return fallback;
  };

  const firstName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-24">
      <section className="fade-up">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
          Friday
        </p>
        <h1 className="mt-3 font-display text-4xl italic text-ink sm:text-5xl">
          Good morning, {firstName}.
        </h1>
        <p className="mt-3 max-w-md text-ink-muted">
          Here&rsquo;s what&rsquo;s waiting for you.
        </p>
      </section>

      <section
        className="fade-up mt-10 flex flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_1px_2px_rgba(38,34,28,0.04)] sm:flex-row"
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-5 w-5 shrink-0 text-clay"
            >
              {action.icon}
            </svg>
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

        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
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
      </section>
    </main>
  );
}
