import { z } from "zod";

export const statusSchema = z.enum([
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "DONE",
]);

export const createProjectSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().nullable().optional(),
  archived: z.boolean().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: statusSchema.optional(),
  estimateMinutes: z.number().int().positive().optional(),
  dueDate: z.coerce.date().optional(),
});

// Also covers status/position moves (reorder) — all fields optional.
export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: statusSchema.optional(),
  position: z.number().optional(),
  estimateMinutes: z.number().int().positive().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

// Manual time-entry (backfilling history).
export const createTimeEntrySchema = z
  .object({
    startedAt: z.coerce.date(),
    endedAt: z.coerce.date(),
  })
  .refine((d) => d.endedAt.getTime() >= d.startedAt.getTime(), {
    message: "endedAt must be at or after startedAt",
    path: ["endedAt"],
  });
