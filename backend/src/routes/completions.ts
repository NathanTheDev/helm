import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../db/client";
import { toDayStart } from "../utils/date";
import {
  createCompletionSchema,
  deleteCompletionQuerySchema,
} from "../validation/habit";

type CompletionParams = { id: string };
type CompletionRequest = Request<CompletionParams>;

export const completionsRouter = Router({ mergeParams: true });

async function findOwnedHabit(habitId: string, userId: string) {
  return prisma.habit.findFirst({ where: { id: habitId, userId } });
}

completionsRouter.get("/", async (req: CompletionRequest, res: Response) => {
  const habit = await findOwnedHabit(req.params.id, req.userId);
  if (!habit) {
    return res.status(404).json({ error: "Habit not found" });
  }

  const completions = await prisma.habitCompletion.findMany({
    where: { habitId: habit.id },
    orderBy: { completedAt: "asc" },
  });
  res.json(completions);
});

completionsRouter.post("/", async (req: CompletionRequest, res: Response) => {
  const habit = await findOwnedHabit(req.params.id, req.userId);
  if (!habit) {
    return res.status(404).json({ error: "Habit not found" });
  }

  const parsed = createCompletionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const completedAt = toDayStart(parsed.data.completedAt ?? new Date());

  const completion = await prisma.habitCompletion.upsert({
    where: { habitId_completedAt: { habitId: habit.id, completedAt } },
    create: {
      habitId: habit.id,
      completedAt,
      quantityProgress: parsed.data.quantityProgress,
      notes: parsed.data.notes,
    },
    update: {
      quantityProgress: parsed.data.quantityProgress,
      notes: parsed.data.notes,
    },
  });
  res.status(201).json(completion);
});

completionsRouter.delete(
  "/",
  async (req: CompletionRequest, res: Response) => {
    const habit = await findOwnedHabit(req.params.id, req.userId);
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }

    const parsed = deleteCompletionQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const completedAt = toDayStart(parsed.data.date);

    await prisma.habitCompletion.deleteMany({
      where: { habitId: habit.id, completedAt },
    });
    res.status(204).send();
  },
);
