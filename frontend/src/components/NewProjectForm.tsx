"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/tasksApi";
import { CardForm, cardClasses } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";

export const PROJECT_COLORS = [
  "#c9633e", // clay
  "#6f7d5c", // sage
  "#4f6d7a", // slate blue
  "#8a6d9e", // muted purple
  "#b08a3e", // ochre
];

export function NewProjectForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(PROJECT_COLORS[0]);

  const close = () => {
    setOpen(false);
    setName("");
    setColor(PROJECT_COLORS[0]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        await createProject({ name: trimmed, color });
        close();
        router.refresh();
      } catch {
        // error surfacing lands in Phase 7
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cardClasses({
          variant: "dashed",
          padding: "none",
          shadow: "none",
          className:
            "flex min-h-[92px] flex-col items-center justify-center gap-2 text-ink-muted transition-colors hover:border-clay hover:text-clay",
        })}
      >
        <span className="text-xl leading-none">+</span>
        <span className="text-sm">New project</span>
      </button>

      <Dialog open={open} onClose={close}>
        <CardForm onSubmit={submit} className="flex flex-col gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            aria-label="Project name"
            autoFocus
          />

          <div className="flex items-center gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                style={{ backgroundColor: c }}
                className={`h-5 w-5 rounded-full transition-transform ${
                  color === c ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""
                }`}
              />
            ))}
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending || !name.trim()}>
              {pending ? "Adding…" : "Add project"}
            </Button>
          </div>
        </CardForm>
      </Dialog>
    </>
  );
}
