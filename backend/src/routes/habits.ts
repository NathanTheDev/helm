import { Router } from "express";
import { prisma } from "../db/client";
import { createHabitSchema, updateHabitSchema } from "../validation/habit";

export const habitsRouter = Router();

habitsRouter.get("/", async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
  });
  res.json(habits);
});

habitsRouter.post("/", async (req, res) => {
  const parsed = createHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const habit = await prisma.habit.create({
    data: { ...parsed.data, userId: req.userId },
  });
  res.status(201).json(habit);
});

habitsRouter.patch("/:id", async (req, res) => {
  const parsed = updateHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Habit not found" });
  }

  const habit = await prisma.habit.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(habit);
});

habitsRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Habit not found" });
  }

  await prisma.habit.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
