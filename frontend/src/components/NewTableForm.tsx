"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTable } from "@/lib/tablesApi";
import { CardForm, cardClasses } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function NewTableForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const close = () => {
    setOpen(false);
    setName("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        const table = await createTable({ name: trimmed });
        close();
        router.push(`/tables/${table.id}`);
      } catch {
        // Error surfacing lands alongside the rest of the app's forms.
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cardClasses({
          variant: "dashed",
          padding: "none",
          shadow: "none",
          className:
            "flex min-h-[92px] w-full flex-col items-center justify-center gap-2 text-ink-muted transition-colors hover:border-clay hover:text-clay",
        })}
      >
        <span className="text-xl leading-none">+</span>
        <span className="text-sm">New table</span>
      </button>
    );
  }

  return (
    <CardForm onSubmit={submit} className="flex flex-col gap-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Table name"
        aria-label="Table name"
        autoFocus
      />

      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={close} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || !name.trim()}>
          {pending ? "Creating…" : "Create table"}
        </Button>
      </div>
    </CardForm>
  );
}
