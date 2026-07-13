import { z } from "zod";

export const fieldTypeSchema = z.enum(["TEXT", "NUMBER", "DATE", "CHECKBOX", "SELECT"]);
export type FieldType = z.infer<typeof fieldTypeSchema>;

export const fieldConfigSchema = z.object({
  options: z.array(z.string().min(1)).min(1),
});

export const createTableSchema = z.object({
  name: z.string().min(1),
});

export const updateTableSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.number().optional(),
});

// SELECT fields need at least one option to be usable; every other type
// ignores `config`.
export const createFieldSchema = z
  .object({
    name: z.string().min(1),
    type: fieldTypeSchema,
    config: fieldConfigSchema.optional(),
    defaultValue: z.unknown().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "SELECT" && !data.config) {
      ctx.addIssue({
        code: "custom",
        message: "SELECT fields require at least one option",
        path: ["config"],
      });
    }
  });

// Field type is immutable after creation (existing row values are stored
// under it) — only name/config/defaultValue/position can change.
export const updateFieldSchema = z.object({
  name: z.string().min(1).optional(),
  config: fieldConfigSchema.optional(),
  defaultValue: z.unknown().optional(),
  position: z.number().optional(),
});

// Values are keyed by field id; per-field type coercion/validation happens
// dynamically in services/customTableValues.ts once the table's fields are
// loaded, not here.
export const createRowSchema = z.object({
  values: z.record(z.string(), z.unknown()).optional(),
});

export const updateRowSchema = z.object({
  values: z.record(z.string(), z.unknown()).optional(),
});
