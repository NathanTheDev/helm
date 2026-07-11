"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getTags,
  createTag,
  attachTag,
  detachTag,
  TAG_COLORS,
  type Tag,
  type Task,
} from "@/lib/tasksApi";

export function TagPicker({ task }: { task: Task }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    getTags()
      .then(setAllTags)
      .catch(() => {});
  }, []);

  const attached = new Set(task.tags.map((t) => t.id));

  const toggle = (tag: Tag) =>
    startTransition(async () => {
      try {
        if (attached.has(tag.id)) await detachTag(task.id, tag.id);
        else await attachTag(task.id, tag.id);
        router.refresh();
      } catch {
        /* ignore */
      }
    });

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    startTransition(async () => {
      try {
        const color = TAG_COLORS[allTags.length % TAG_COLORS.length];
        const tag = await createTag({ name: n, color });
        setAllTags((prev) => [...prev, tag]);
        await attachTag(task.id, tag.id);
        setName("");
        router.refresh();
      } catch {
        /* ignore */
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        Tags
      </span>
      <div className="flex flex-wrap gap-1.5">
        {allTags.map((tag) => {
          const on = attached.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag)}
              disabled={pending}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity disabled:opacity-50"
              style={
                on
                  ? { backgroundColor: tag.color, color: "#fdfbf6" }
                  : {
                      backgroundColor: `${tag.color}22`,
                      color: tag.color,
                      opacity: 0.7,
                    }
              }
            >
              {on ? "✓ " : ""}
              {tag.name}
            </button>
          );
        })}
      </div>
      <form onSubmit={addTag} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New tag"
          aria-label="New tag"
          className="flex-1 rounded-lg border border-line bg-paper px-2 py-1 text-xs text-ink outline-none focus:border-clay"
        />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="rounded-full bg-clay-soft/60 px-3 py-1 text-xs font-medium text-clay transition-colors hover:bg-clay-soft disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
