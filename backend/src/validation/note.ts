import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
});
