"use client";

import { useEffect, useMemo, useState } from "react";
import { getHabitStats, type HabitDailyRate, type HabitStatsRange } from "@/lib/api";
import { Card } from "@/components/ui/Card";

const RANGES: { id: HabitStatsRange; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "all", label: "All time" },
];

const CHART_HEIGHT = 140;
const CHART_WIDTH = 600;

function formatDayLabel(date: string, range: HabitStatsRange): string {
  const d = new Date(`${date}T00:00:00`);
  if (range === "week") return d.toLocaleDateString(undefined, { weekday: "short" });
  if (range === "month") return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export function HabitsChart() {
  const [range, setRange] = useState<HabitStatsRange>("week");
  const [data, setData] = useState<HabitDailyRate[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHabitStats(range)
      .then((rates) => {
        if (!cancelled) setData(rates);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const average = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return Math.round(data.reduce((sum, d) => sum + d.percent, 0) / data.length);
  }, [data]);

  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    const stepX = data.length > 1 ? CHART_WIDTH / (data.length - 1) : 0;
    return data.map((d, i) => ({
      x: data.length > 1 ? i * stepX : CHART_WIDTH / 2,
      y: CHART_HEIGHT - (d.percent / 100) * CHART_HEIGHT,
      ...d,
    }));
  }, [data]);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x},${CHART_HEIGHT} L${points[0].x},${CHART_HEIGHT} Z`
      : "";

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  // Decimate x-axis labels so they never crowd (e.g. "month"/"year" can have
  // 30+ points) - at most 6 evenly spaced labels, always including the last.
  const xAxisLabels = useMemo(() => {
    if (points.length === 0) return [];
    const maxLabels = 6;
    const step = Math.max(1, Math.ceil(points.length / maxLabels));
    const indices = new Set<number>();
    for (let i = 0; i < points.length; i += step) indices.add(i);
    indices.add(points.length - 1);
    return [...indices].sort((a, b) => a - b).map((i) => ({ i, label: formatDayLabel(points[i].date, range) }));
  }, [points, range]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-ink">Habit completion</h3>
          <p className="font-mono text-xs text-ink-muted">
            {data ? `${average}% average` : failed ? "Couldn’t load" : "Loading…"}
          </p>
        </div>
        <div className="flex overflow-hidden rounded-full border border-line text-xs">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setRange(r.id);
                setData(null);
                setHoverIndex(null);
              }}
              className={`px-3 py-1.5 font-medium transition-colors ${
                range === r.id ? "bg-clay text-surface" : "text-ink-muted hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-5">
        {points.length > 0 ? (
          <div className="grid grid-cols-[2.5rem_1fr] gap-2">
            <div className="flex h-36 flex-col justify-between py-0.5 font-mono text-[10px] text-ink-muted">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              preserveAspectRatio="none"
              className="h-36 w-full overflow-visible"
              onMouseLeave={() => setHoverIndex(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                const idx = Math.round(ratio * (points.length - 1));
                setHoverIndex(Math.min(points.length - 1, Math.max(0, idx)));
              }}
            >
              {[0, 50, 100].map((pct) => (
                <line
                  key={pct}
                  x1={0}
                  x2={CHART_WIDTH}
                  y1={CHART_HEIGHT - (pct / 100) * CHART_HEIGHT}
                  y2={CHART_HEIGHT - (pct / 100) * CHART_HEIGHT}
                  stroke="var(--line)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              <path d={areaPath} fill="var(--sage)" fillOpacity={0.1} stroke="none" />
              <path
                d={linePath}
                fill="none"
                stroke="var(--sage)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />

              {hovered && (
                <>
                  <line
                    x1={hovered.x}
                    x2={hovered.x}
                    y1={0}
                    y2={CHART_HEIGHT}
                    stroke="var(--ink-muted)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={hovered.x} cy={hovered.y} r={4} fill="var(--sage)" stroke="var(--surface)" strokeWidth={2} />
                </>
              )}
            </svg>

            <div />
            <div className="relative h-4 font-mono text-[10px] text-ink-muted">
              {xAxisLabels.map(({ i, label }) => (
                <span
                  key={i}
                  className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                  style={{ left: `${(points[i].x / CHART_WIDTH) * 100}%` }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center font-mono text-xs text-ink-muted">
            {failed ? "Couldn’t load habit stats." : "Loading…"}
          </div>
        )}

        {hovered && (
          <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-ink-muted">
            <span>{formatDayLabel(hovered.date, range)}</span>
            <span className="text-ink">
              {hovered.completed}/{hovered.total} habits &middot; {hovered.percent}%
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
