"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getHabits } from "@/lib/api";
import { getProjects, getProjectTasks, getWorklog, formatDuration } from "@/lib/tasksApi";
import { getNotes } from "@/lib/notesApi";
import { getCalendarEvents, type CalendarEvent } from "@/lib/calendarApi";
import { useAuth } from "@/lib/auth-context";
import {
  DEFAULT_WIDGET_ORDER,
  HOME_WIDGET_LABELS,
  readHomeLayout,
  writeHomeLayout,
  type HomeLayout,
  type HomeWidgetId,
} from "@/lib/home-layout";
import { cardClasses } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/Button";
import { EyeOffIcon, GripIcon, SlidersIcon } from "@/components/ui/Icon";
import { CalendarWidget } from "@/components/CalendarWidget";
import { HabitsChart } from "@/components/HabitsChart";

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
  {
    href: "/worklog",
    label: "Worklog",
    hint: "—",
    tint: "bg-sage-soft text-sage",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </>
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

function WidgetShell({
  id,
  editing,
  onHide,
  children,
}: {
  id: HomeWidgetId;
  editing: boolean;
  onHide: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={editing ? "relative rounded-[28px] ring-1 ring-line" : ""}>
      {editing && (
        <div className="absolute -top-3.5 right-4 z-10 flex items-center gap-1 rounded-full border border-line bg-surface px-1.5 py-1 shadow-md">
          <button
            {...attributes}
            {...listeners}
            aria-label={`Drag to reorder ${HOME_WIDGET_LABELS[id]}`}
            className="flex h-6 w-6 cursor-grab items-center justify-center text-ink-muted transition-colors hover:text-ink active:cursor-grabbing"
          >
            <GripIcon className="h-3.5 w-3.5" />
          </button>
          <IconButton tone="danger" onClick={onHide} aria-label={`Hide ${HOME_WIDGET_LABELS[id]}`}>
            <EyeOffIcon />
          </IconButton>
        </div>
      )}
      {children}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [dueToday, setDueToday] = useState(0);
  const [openTasks, setOpenTasks] = useState(0);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [habitsGlance, setHabitsGlance] = useState<GlanceItem[]>([]);
  const [projectsGlance, setProjectsGlance] = useState<GlanceItem[]>([]);
  const [notesGlance, setNotesGlance] = useState<GlanceItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [layout, setLayout] = useState<HomeLayout>({ order: DEFAULT_WIDGET_ORDER, hidden: [] });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setLayout(readHomeLayout());
  }, []);

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

    getWorklog()
      .then((worklog) => setTodaySeconds(worklog.todaySeconds))
      .catch(() => setTodaySeconds(0));
  }, []);

  const actionHint = (label: string, fallback: string) => {
    if (label === "Habits") return `${dueToday} due today`;
    if (label === "Projects") return `${openTasks} open`;
    if (label === "At a glance") return `${glance.length} ${glance.length === 1 ? "update" : "updates"}`;
    if (label === "Worklog") return `${formatDuration(todaySeconds)} today`;
    return fallback;
  };

  const glance = [...habitsGlance, ...projectsGlance, ...notesGlance];

  const firstName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const now = new Date();
  const dayLabel = now.toLocaleDateString(undefined, { weekday: "long" });
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const persist = (next: HomeLayout) => {
    setLayout(next);
    writeHomeLayout(next);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = layout.order.indexOf(active.id as HomeWidgetId);
    const newIndex = layout.order.indexOf(over.id as HomeWidgetId);
    if (oldIndex < 0 || newIndex < 0) return;
    persist({ ...layout, order: arrayMove(layout.order, oldIndex, newIndex) });
  };

  const hideWidget = (id: HomeWidgetId) => persist({ ...layout, hidden: [...layout.hidden, id] });
  const showWidget = (id: HomeWidgetId) => persist({ ...layout, hidden: layout.hidden.filter((w) => w !== id) });

  const visibleOrder = useMemo(
    () => layout.order.filter((id) => !layout.hidden.includes(id)),
    [layout],
  );

  const widgetContent: Record<HomeWidgetId, ReactNode> = {
    actions: (
      <section className="flex flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-sm sm:flex-row">
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
              <span className="text-sm font-medium text-ink">{action.label}</span>
              <span className="text-xs text-ink-muted">{actionHint(action.label, action.hint)}</span>
            </span>
          </Link>
        ))}
      </section>
    ),
    chart: <HabitsChart />,
    glance: (
      <section id="at-a-glance" className="scroll-mt-24">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-ink">At a glance</h2>
          <span className="font-mono text-xs text-ink-muted">{glance.length} items</span>
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
              <li key={item.text} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-paper/60">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${kindColor[item.kind]}`} aria-hidden />
                <span className="flex-1 text-sm text-ink">{item.text}</span>
                <span className="font-mono text-xs text-ink-muted">{item.time}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    ),
    calendar: <CalendarWidget events={calendarEvents} />,
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-24">
      <section className="fade-up flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">{dayLabel}</p>
          <h1 className="mt-3 font-display text-4xl italic text-ink sm:text-5xl">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-3 max-w-md text-ink-muted">Here&rsquo;s what&rsquo;s waiting for you.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className={`mt-1 flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            editing
              ? "border-clay bg-clay text-surface"
              : "border-line text-ink-muted hover:border-clay hover:text-clay"
          }`}
        >
          <SlidersIcon />
          {editing ? "Done" : "Customize"}
        </button>
      </section>

      {editing && (
        <p className="fade-up mt-4 text-xs text-ink-muted">
          Drag <GripIcon className="inline h-3 w-3 -translate-y-px" /> to reorder widgets, or hide them. Hidden
          widgets can be added back below.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visibleOrder} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-10 [&>*:first-child]:mt-10">
            {visibleOrder.map((id) => (
              <WidgetShell key={id} id={id} editing={editing} onHide={() => hideWidget(id)}>
                {widgetContent[id]}
              </WidgetShell>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {editing && layout.hidden.length > 0 && (
        <div className="fade-up mt-8 flex flex-wrap items-center gap-2 border-t border-line pt-6">
          <span className="text-xs text-ink-muted">Hidden:</span>
          {layout.hidden.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => showWidget(id)}
              className="rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-clay hover:text-clay"
            >
              + {HOME_WIDGET_LABELS[id]}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
