import { z } from "zod";
import type { CustomField } from "@prisma/client";

export type FieldShape = { name: string; type: string; config: unknown };

export class RowValidationError extends Error {
  constructor(public fieldErrors: Record<string, string>) {
    super("Invalid row values");
  }
}

function schemaForField(field: FieldShape): z.ZodType {
  switch (field.type) {
    case "TEXT":
      return z.string();
    case "NUMBER":
      return z.coerce.number();
    case "DATE":
      return z.coerce.date().transform((d) => d.toISOString());
    case "CHECKBOX":
      return z.boolean();
    case "SELECT": {
      const options = (field.config as { options?: string[] } | null)?.options ?? [];
      return options.length > 0 ? z.enum(options as [string, ...string[]]) : z.never();
    }
    default:
      return z.unknown();
  }
}

// Validates/coerces a single value (e.g. a field's defaultValue, or one
// entry of a row's values) against its field's type. Missing/null values
// resolve to null rather than erroring — every field is optional.
export function validateFieldValue(field: FieldShape, value: unknown): unknown {
  if (value === undefined || value === null) return null;
  const parsed = schemaForField(field).safeParse(value);
  if (!parsed.success) {
    throw new RowValidationError({ [field.name]: `Invalid value for field "${field.name}"` });
  }
  return parsed.data;
}

// Row create: every field on the table gets an entry — the provided value
// (validated/coerced per type) or, if omitted, the field's defaultValue.
export function buildRowValues(
  fields: CustomField[],
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const fieldErrors: Record<string, string> = {};

  for (const field of fields) {
    const provided = Object.prototype.hasOwnProperty.call(raw, field.id)
      ? raw[field.id]
      : field.defaultValue;
    try {
      result[field.id] = validateFieldValue(field, provided);
    } catch {
      fieldErrors[field.id] = `Invalid value for field "${field.name}"`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new RowValidationError(fieldErrors);
  }
  return result;
}

// Row update: only the keys present in raw are (re)validated; everything
// else in the row's existing values is left untouched.
export function mergeRowValues(
  fields: CustomField[],
  existing: Record<string, unknown>,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const fieldsById = new Map(fields.map((f) => [f.id, f]));
  const result = { ...existing };
  const fieldErrors: Record<string, string> = {};

  for (const [fieldId, value] of Object.entries(raw)) {
    const field = fieldsById.get(fieldId);
    if (!field) continue; // ignore ids that aren't real fields on this table
    try {
      result[fieldId] = validateFieldValue(field, value);
    } catch {
      fieldErrors[fieldId] = `Invalid value for field "${field.name}"`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new RowValidationError(fieldErrors);
  }
  return result;
}
