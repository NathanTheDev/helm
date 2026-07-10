import { z } from "zod";

export const frequencySchema = z.enum(["DAILY", "WEEKLY"]);

export const createHabitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  emoji: z.string().optional(),
  frequency: frequencySchema,
  quantity: z.number().int().positive().default(1),
});

export const updateHabitSchema = createHabitSchema.partial();

export const createCompletionSchema = z.object({
  completedAt: z.coerce.date().optional(),
  quantityProgress: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export const deleteCompletionQuerySchema = z.object({
  date: z.coerce.date(),
});
