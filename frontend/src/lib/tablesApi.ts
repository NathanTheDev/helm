import { apiUrl, authHeaders } from "./api";

export type FieldType = "TEXT" | "NUMBER" | "DATE" | "CHECKBOX" | "SELECT";

export interface FieldConfig {
  options: string[];
}

export interface CustomTable {
  id: string;
  userId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomField {
  id: string;
  tableId: string;
  name: string;
  type: FieldType;
  position: number;
  config: FieldConfig | null;
  defaultValue: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface CustomTableWithFields extends CustomTable {
  fields: CustomField[];
}

export interface CustomRow {
  id: string;
  tableId: string;
  values: Record<string, unknown>;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// ---- tables ----

export async function getTables(): Promise<CustomTable[]> {
  const res = await fetch(apiUrl("/api/tables"), {
    cache: "no-store",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load tables: ${res.status}`);
  return res.json();
}

export async function getTable(id: string): Promise<CustomTableWithFields> {
  const res = await fetch(apiUrl(`/api/tables/${id}`), {
    cache: "no-store",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load table: ${res.status}`);
  return res.json();
}

export async function createTable(input: { name: string }): Promise<CustomTable> {
  const res = await fetch(apiUrl("/api/tables"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create table: ${res.status}`);
  return res.json();
}

export async function updateTable(
  id: string,
  input: { name?: string; position?: number },
): Promise<CustomTable> {
  const res = await fetch(apiUrl(`/api/tables/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update table: ${res.status}`);
  return res.json();
}

export async function deleteTable(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/tables/${id}`), {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete table: ${res.status}`);
}

// ---- fields ----

export interface FieldInput {
  name: string;
  type: FieldType;
  config?: FieldConfig;
  defaultValue?: unknown;
}

export async function createField(
  tableId: string,
  input: FieldInput,
): Promise<CustomField> {
  const res = await fetch(apiUrl(`/api/tables/${tableId}/fields`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create field: ${res.status}`);
  return res.json();
}

export async function updateField(
  fieldId: string,
  input: { name?: string; config?: FieldConfig; defaultValue?: unknown; position?: number },
): Promise<CustomField> {
  const res = await fetch(apiUrl(`/api/fields/${fieldId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update field: ${res.status}`);
  return res.json();
}

export async function deleteField(fieldId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/fields/${fieldId}`), {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete field: ${res.status}`);
}

// ---- rows ----

export async function getRows(tableId: string): Promise<CustomRow[]> {
  const res = await fetch(apiUrl(`/api/tables/${tableId}/rows`), {
    cache: "no-store",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load rows: ${res.status}`);
  return res.json();
}

export async function createRow(
  tableId: string,
  input: { values?: Record<string, unknown> } = {},
): Promise<CustomRow> {
  const res = await fetch(apiUrl(`/api/tables/${tableId}/rows`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create row: ${res.status}`);
  return res.json();
}

export async function updateRow(
  rowId: string,
  input: { values?: Record<string, unknown>; position?: number },
): Promise<CustomRow> {
  const res = await fetch(apiUrl(`/api/rows/${rowId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update row: ${res.status}`);
  return res.json();
}

export async function deleteRow(rowId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/rows/${rowId}`), {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete row: ${res.status}`);
}

// ---- client-side sort/filter/format helpers ----
// All sorting/filtering happens over the already-fetched rows array, in
// line with how every other page in this app fetches-then-renders rather
// than pushing query params to the backend.

export type SortDirection = "asc" | "desc";

function compareValues(field: CustomField, a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1; // nulls sort last
  if (b == null) return -1;

  switch (field.type) {
    case "NUMBER":
      return (a as number) - (b as number);
    case "DATE":
      return new Date(a as string).getTime() - new Date(b as string).getTime();
    case "CHECKBOX":
      return a === b ? 0 : a ? -1 : 1; // checked first
    default:
      return String(a).localeCompare(String(b));
  }
}

export function sortRows(
  rows: CustomRow[],
  field: CustomField,
  direction: SortDirection,
): CustomRow[] {
  const sorted = [...rows].sort((a, b) =>
    compareValues(field, a.values[field.id], b.values[field.id]),
  );
  return direction === "desc" ? sorted.reverse() : sorted;
}

export type FilterOperator =
  | "contains"
  | "equals"
  | "gt"
  | "lt"
  | "before"
  | "after"
  | "on"
  | "is"
  | "isNot";

export const FILTER_OPERATORS_BY_TYPE: Record<
  FieldType,
  { value: FilterOperator; label: string }[]
> = {
  TEXT: [
    { value: "contains", label: "contains" },
    { value: "equals", label: "is" },
  ],
  NUMBER: [
    { value: "equals", label: "=" },
    { value: "gt", label: ">" },
    { value: "lt", label: "<" },
  ],
  DATE: [
    { value: "on", label: "on" },
    { value: "before", label: "before" },
    { value: "after", label: "after" },
  ],
  CHECKBOX: [{ value: "is", label: "is" }],
  SELECT: [
    { value: "is", label: "is" },
    { value: "isNot", label: "is not" },
  ],
};

function toTime(value: unknown): number {
  return value ? new Date(value as string).getTime() : NaN;
}

function sameDay(a: unknown, b: unknown): boolean {
  if (!a || !b) return false;
  return new Date(a as string).toDateString() === new Date(b as string).toDateString();
}

function matchesFilter(
  field: CustomField,
  cell: unknown,
  operator: FilterOperator,
  target: unknown,
): boolean {
  switch (operator) {
    case "contains":
      return String(cell ?? "").toLowerCase().includes(String(target ?? "").toLowerCase());
    case "equals":
      if (field.type === "NUMBER") return Number(cell) === Number(target);
      return String(cell ?? "") === String(target ?? "");
    case "gt":
      return Number(cell) > Number(target);
    case "lt":
      return Number(cell) < Number(target);
    case "on":
      return sameDay(cell, target);
    case "before":
      return toTime(cell) < toTime(target);
    case "after":
      return toTime(cell) > toTime(target);
    case "is":
      if (field.type === "CHECKBOX") return Boolean(cell) === Boolean(target);
      return String(cell ?? "") === String(target ?? "");
    case "isNot":
      return String(cell ?? "") !== String(target ?? "");
    default:
      return true;
  }
}

export function filterRows(
  rows: CustomRow[],
  field: CustomField,
  operator: FilterOperator,
  value: unknown,
): CustomRow[] {
  return rows.filter((row) => matchesFilter(field, row.values[field.id], operator, value));
}

export function formatCellValue(field: CustomField, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (field.type) {
    case "DATE":
      return new Date(value as string).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    case "CHECKBOX":
      return value ? "Yes" : "No";
    default:
      return String(value);
  }
}

// Seed values for a new row's form, one entry per field.
export function defaultsForFields(fields: CustomField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    values[field.id] = field.defaultValue ?? (field.type === "CHECKBOX" ? false : null);
  }
  return values;
}
