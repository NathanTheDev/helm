export type HomeWidgetId = "actions" | "chart" | "glance" | "calendar";

export const HOME_WIDGET_LABELS: Record<HomeWidgetId, string> = {
  actions: "Quick actions",
  chart: "Habit completion",
  glance: "At a glance",
  calendar: "Coming up",
};

export const DEFAULT_WIDGET_ORDER: HomeWidgetId[] = ["actions", "chart", "glance", "calendar"];

export interface HomeLayout {
  order: HomeWidgetId[];
  hidden: HomeWidgetId[];
}

const HOME_LAYOUT_STORAGE_KEY = "helm-home-layout";
const DEFAULT_LAYOUT: HomeLayout = { order: DEFAULT_WIDGET_ORDER, hidden: [] };

function isWidgetId(value: unknown): value is HomeWidgetId {
  return typeof value === "string" && (DEFAULT_WIDGET_ORDER as string[]).includes(value);
}

export function readHomeLayout(): HomeLayout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(HOME_LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw);

    const order: HomeWidgetId[] = Array.isArray(parsed.order)
      ? parsed.order.filter(isWidgetId)
      : [...DEFAULT_WIDGET_ORDER];
    // Widgets added to the app after this layout was saved still show up.
    for (const id of DEFAULT_WIDGET_ORDER) {
      if (!order.includes(id)) order.push(id);
    }

    const hidden: HomeWidgetId[] = Array.isArray(parsed.hidden) ? parsed.hidden.filter(isWidgetId) : [];

    return { order, hidden };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function writeHomeLayout(layout: HomeLayout) {
  localStorage.setItem(HOME_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
}
