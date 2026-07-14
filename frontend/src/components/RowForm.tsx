"use client";

import { useState, useTransition } from "react";
import {
  createRow,
  updateRow,
  defaultsForFields,
  type CustomField,
  type CustomRow,
} from "@/lib/tablesApi";
import { renderFieldControl } from "@/components/FieldForm";
import { CardForm, cardClasses } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type RowFormProps =
  | { mode: "create"; tableId: string; fields: CustomField[]; onCreated: (row: CustomRow) => void }
  | {
      mode: "edit";
      fields: CustomField[];
      row: CustomRow;
      onSaved: (row: CustomRow) => void;
      onCancel: () => void;
    };

export function RowForm(props: RowFormProps) {
  const { fields } = props;
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    props.mode === "edit" ? { ...props.row.values } : defaultsForFields(fields),
  );
  const [error, setError] = useState<string | null>(null);

  const setFieldValue = (fieldId: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [fieldId]: value }));

  const close = () => {
    setOpen(false);
    setValues(defaultsForFields(fields));
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (props.mode === "edit") {
          const saved = await updateRow(props.row.id, { values });
          props.onSaved(saved);
        } else {
          const saved = await createRow(props.tableId, { values });
          props.onCreated(saved);
          close();
        }
      } catch {
        setError("Couldn’t save this row. Please try again.");
      }
    });
  };

  if (props.mode === "create" && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cardClasses({
          variant: "dashed",
          padding: "none",
          shadow: "none",
          className:
            "flex min-h-[52px] w-full items-center justify-center gap-2 text-ink-muted transition-colors hover:border-clay hover:text-clay",
        })}
      >
        <span className="text-sm">+ Add row</span>
      </button>
    );
  }

  return (
    <CardForm onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.id} className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
              {field.name}
            </span>
            {renderFieldControl(field, values[field.id], (value) => setFieldValue(field.id, value))}
          </label>
        ))}
      </div>

      {error && <p className="text-xs text-clay">{error}</p>}

      <div className="mt-1 flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={props.mode === "edit" ? props.onCancel : close}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : props.mode === "edit" ? "Save row" : "Add row"}
        </Button>
      </div>
    </CardForm>
  );
}
