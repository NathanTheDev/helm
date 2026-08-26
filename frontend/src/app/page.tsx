"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { DEFAULT_SPACE_NAME, readSpaceName, writeSpaceName } from "@/lib/space-name";
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
import { getProjects, getProjectTasks, getWorklog } from "@/lib/tasksApi";
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
import { EyeOffIcon, GearIcon, GripIcon, SlidersIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Tooltip } from "@/components/ui/Tooltip";
import { CalendarWidget } from "@/components/CalendarWidget";
import { HabitsChart } from "@/components/HabitsChart";
import { AiChatWidget } from "@/components/AiChatWidget";

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
  const [habitsGlance, setHabitsGlance] = useState<GlanceItem[]>([]);
  const [projectsGlance, setProjectsGlance] = useState<GlanceItem[]>([]);
  const [notesGlance, setNotesGlance] = useState<GlanceItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [layout, setLayout] = useState<HomeLayout>({ order: DEFAULT_WIDGET_ORDER, hidden: [] });
  const [editing, setEditing] = useState(false);
  const [habitsLoaded, setHabitsLoaded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [spaceName, setSpaceName] = useState(DEFAULT_SPACE_NAME);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  function commitSpaceName(next: string) {
    const trimmed = next.trim() || DEFAULT_SPACE_NAME;
    writeSpaceName(trimmed);
    setSpaceName(trimmed);
  }

  useEffect(() => {
    setSpaceName(readSpaceName());
  }, []);

  useEffect(() => {
    if (!profileOpen && !settingsOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (profileOpen && profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (settingsOpen && settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [profileOpen, settingsOpen]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [worklogLoaded, setWorklogLoaded] = useState(false);
  const initialLoading = !habitsLoaded || !projectsLoaded || !notesLoaded || !worklogLoaded;

  useEffect(() => {
    setLayout(readHomeLayout());
  }, []);

  useEffect(() => {
    getHabits()
      .then((habits) => {
        const due = habits.filter((h) => h.isDueToday && !h.isCompletedToday);

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
      .catch(() => setHabitsGlance([]))
      .finally(() => setHabitsLoaded(true));

    getProjects()
      .then(async (projects) => {
        const active = projects.filter((p) => !p.archived);
        const taskLists = await Promise.all(active.map((p) => getProjectTasks(p.id)));
        const open = taskLists.flat().filter((t) => t.status !== "DONE").length;

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
      .catch(() => setProjectsGlance([]))
      .finally(() => setProjectsLoaded(true));

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
      .catch(() => setNotesGlance([]))
      .finally(() => setNotesLoaded(true));

    getCalendarEvents()
      .then((result) => {
        setCalendarEvents(result.events);
        setCalendarConnected(result.connected);
      })
      .catch(() => {
        setCalendarEvents([]);
        setCalendarConnected(false);
      });

    getWorklog()
      .then(() => setWorklogLoaded(true))
      .catch(() => setWorklogLoaded(true));
  }, []);

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
    aiChat: <AiChatWidget />,
    chart: <HabitsChart />,
    glance: (
      <section id="at-a-glance" className="scroll-mt-24">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-ink">At a glance</h2>
          <span className="font-mono text-xs text-ink-muted">
            {initialLoading ? "—" : `${glance.length} items`}
          </span>
        </div>

        {initialLoading ? (
          <div className={cardClasses({ padding: "none", className: "mt-4 divide-y divide-line overflow-hidden" })}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-line" />
                <div className="h-3.5 w-56 animate-pulse rounded bg-paper" />
              </div>
            ))}
          </div>
        ) : glance.length === 0 ? (
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
    calendar: <CalendarWidget events={calendarEvents} connected={calendarConnected} />,
  };

  return (
    <>
      {/* Pinned to the true top-right corner of the screen (position: fixed,
          viewport-relative) rather than the header row below - that row
          lives inside <main>'s centered max-w-5xl column, so on any viewport
          wider than that, right-aligning within it stops short of the
          actual screen edge. Desktop-only: mobile already has account
          access via MobileNavBar's hamburger menu. */}
      <div className="fixed right-4 top-4 z-30 hidden items-center gap-2 sm:right-8 sm:top-6 sm:flex">
        {user && (
          <div ref={profileMenuRef} className="relative">
            <Tooltip content={user.email ?? "Profile"} side="bottom" disabled={profileOpen}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                aria-label="Profile"
                aria-expanded={profileOpen}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-soft font-display text-sm text-clay shadow-sm transition-colors hover:bg-clay-soft/70"
              >
                {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
              </button>
            </Tooltip>

            {profileOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-card border border-line bg-surface p-3 shadow-md">
                <p className="truncate px-1 text-xs text-ink-muted">{user.email}</p>
                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="mt-2 w-full rounded-control px-1 py-1.5 text-left text-sm text-ink-muted transition-colors hover:bg-clay-soft/40 hover:text-ink"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}

        <div ref={settingsMenuRef} className="relative">
          <Tooltip content="Settings" side="bottom" disabled={settingsOpen}>
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              aria-label="Settings"
              aria-expanded={settingsOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-paper text-ink-muted shadow-sm transition-colors hover:border-clay hover:text-clay"
            >
              <GearIcon />
            </button>
          </Tooltip>

          {settingsOpen && (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-card border border-line bg-surface p-3 shadow-md">
              <label className="block px-1 text-xs text-ink-muted">
                Space name
                <Input
                  defaultValue={spaceName}
                  onBlur={(e) => commitSpaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className="mt-1 w-full"
                  size="sm"
                />
              </label>
            </div>
          )}
        </div>
      </div>

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

        {layout.hidden.length > 0 && (
          <div className="fade-up mt-8 flex flex-wrap items-center gap-2 border-t border-line pt-6">
            <span className="text-xs text-ink-muted">Add widgets:</span>
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
    </>
  );
}
