"use client";

import { useState, useTransition } from "react";
import {
  createField,
  updateField,
  type CustomField,
  type FieldConfig,
  type FieldType,
} from "@/lib/tablesApi";
import { CardForm } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { CheckIcon, TrashIcon } from "@/components/ui/Icon";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date + time" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "SELECT", label: "Select" },
];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = Object.fromEntries(
  FIELD_TYPES.map((t) => [t.value, t.label]),
) as Record<FieldType, string>;

function toDatetimeLocal(value: unknown): string {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Shared by FieldForm's "default value" control and RowForm's per-field
// cells (Phase 6) so the type -> control mapping only lives in one place.
export function renderFieldControl(
  field: { type: FieldType; config?: FieldConfig | null },
  value: unknown,
  onChange: (value: unknown) => void,
  opts: { id?: string; autoFocus?: boolean } = {},
) {
  const { id, autoFocus } = opts;
  switch (field.type) {
    case "NUMBER":
      return (
        <Input
          id={id}
          type="number"
          autoFocus={autoFocus}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
    case "DATE":
      return (
        <Input
          id={id}
          type="datetime-local"
          autoFocus={autoFocus}
          value={toDatetimeLocal(value)}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        />
      );
    case "CHECKBOX":
      return (
        <button
          type="button"
          id={id}
          autoFocus={autoFocus}
          onClick={() => onChange(!value)}
          aria-pressed={Boolean(value)}
          className={`flex h-8 w-8 items-center justify-center rounded-control border transition-colors ${
            value
              ? "border-clay bg-clay-soft/60 text-clay"
              : "border-line text-transparent hover:text-ink-muted/60"
          }`}
        >
          <CheckIcon />
        </button>
      );
    case "SELECT": {
      const options = field.config?.options ?? [];
      return (
        <Select
          id={id}
          autoFocus={autoFocus}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">—</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      );
    }
    default:
      return (
        <Input
          id={id}
          type="text"
          autoFocus={autoFocus}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

type FieldFormProps = {
  onSaved: (field: CustomField) => void;
  onCancel: () => void;
} & ({ mode: "create"; tableId: string } | { mode: "edit"; field: CustomField });

export function FieldForm(props: FieldFormProps) {
  const { onSaved, onCancel } = props;
  const editing = props.mode === "edit";

  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(editing ? props.field.name : "");
  const [type, setType] = useState<FieldType>(editing ? props.field.type : "TEXT");
  const [options, setOptions] = useState<string[]>(
    editing ? (props.field.config?.options ?? []) : [],
  );
  const [optionDraft, setOptionDraft] = useState("");
  const [defaultValue, setDefaultValue] = useState<unknown>(
    editing ? props.field.defaultValue : null,
  );
  const [error, setError] = useState<string | null>(null);

  const addOption = () => {
    const trimmed = optionDraft.trim();
    if (!trimmed || options.includes(trimmed)) return;
    setOptions((prev) => [...prev, trimmed]);
    setOptionDraft("");
  };

  const removeOption = (option: string) => {
    setOptions((prev) => prev.filter((o) => o !== option));
    if (defaultValue === option) setDefaultValue(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (type === "SELECT" && options.length === 0) {
      setError("Add at least one option for a Select field.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const config: FieldConfig | undefined = type === "SELECT" ? { options } : undefined;
        if (editing) {
          const saved = await updateField(props.field.id, {
            name: trimmed,
            config,
            defaultValue,
          });
          onSaved(saved);
        } else {
          const saved = await createField(props.tableId, {
            name: trimmed,
            type,
            config,
            defaultValue,
          });
          onSaved(saved);
        }
      } catch {
        setError("Couldn’t save this field. Please try again.");
      }
    });
  };

  return (
    <CardForm onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Field name"
          aria-label="Field name"
          autoFocus
          className="flex-1"
        />
        {editing ? (
          <Badge className="self-center">{FIELD_TYPE_LABELS[type]}</Badge>
        ) : (
          <Select
            value={type}
            onChange={(e) => {
              const next = e.target.value as FieldType;
              setType(next);
              setOptions([]);
              setDefaultValue(next === "CHECKBOX" ? false : null);
            }}
            aria-label="Field type"
            className="w-40"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        )}
      </div>

      {type === "SELECT" && (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Options
          </span>
          <div className="flex flex-wrap gap-1.5">
            {options.map((option) => (
              <span
                key={option}
                className="flex items-center gap-1 rounded-full bg-clay-soft/60 px-2.5 py-0.5 text-xs text-clay"
              >
                {option}
                <button
                  type="button"
                  onClick={() => removeOption(option)}
                  aria-label={`Remove option ${option}`}
                  className="text-clay/70 transition-colors hover:text-clay"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={optionDraft}
              onChange={(e) => setOptionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOption();
                }
              }}
              placeholder="New option"
              aria-label="New option"
              size="xs"
              className="flex-1"
            />
            <Button type="button" variant="subtle" size="xs" onClick={addOption} disabled={!optionDraft.trim()}>
              Add
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Default value
        </span>
        {renderFieldControl({ type, config: { options } }, defaultValue, setDefaultValue)}
      </div>

      {error && <p className="text-xs text-clay">{error}</p>}

      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || !name.trim()}>
          {pending ? "Saving…" : editing ? "Save field" : "Add field"}
        </Button>
      </div>
    </CardForm>
  );
}
