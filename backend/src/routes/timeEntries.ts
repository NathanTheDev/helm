import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../db/client";
import { createTimeEntrySchema } from "../validation/task";

// Mounted at /api/tasks/:id — timer control + manual time-entry history.
export const taskTimeRouter = Router({ mergeParams: true });

type TaskParams = { id: string };

async function findOwnedTask(taskId: string, userId: string) {
  return prisma.task.findFirst({ where: { id: taskId, userId } });
}

function durationSeconds(startedAt: Date, endedAt: Date): number {
  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
}

// Stop every currently-running entry for the user (enforces one active timer).
async function stopRunningForUser(userId: string, now: Date) {
  const running = await prisma.timeEntry.findMany({
    where: { userId, endedAt: null },
  });
  for (const entry of running) {
    await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { endedAt: now, durationSeconds: durationSeconds(entry.startedAt, now) },
    });
  }
}

taskTimeRouter.post(
  "/timer/start",
  async (req: Request<TaskParams>, res: Response) => {
    const task = await findOwnedTask(req.params.id, req.userId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const now = new Date();
    await stopRunningForUser(req.userId, now);

    const entry = await prisma.timeEntry.create({
      data: { userId: req.userId, taskId: task.id, startedAt: now },
    });
    res.status(201).json(entry);
  },
);

taskTimeRouter.post(
  "/timer/stop",
  async (req: Request<TaskParams>, res: Response) => {
    const task = await findOwnedTask(req.params.id, req.userId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const running = await prisma.timeEntry.findFirst({
      where: { taskId: task.id, userId: req.userId, endedAt: null },
    });
    if (!running) {
      return res.status(404).json({ error: "No running timer for this task" });
    }

    const now = new Date();
    const entry = await prisma.timeEntry.update({
      where: { id: running.id },
      data: { endedAt: now, durationSeconds: durationSeconds(running.startedAt, now) },
    });
    res.json(entry);
  },
);

taskTimeRouter.get(
  "/time-entries",
  async (req: Request<TaskParams>, res: Response) => {
    const task = await findOwnedTask(req.params.id, req.userId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const entries = await prisma.timeEntry.findMany({
      where: { taskId: task.id },
      orderBy: { startedAt: "desc" },
    });
    res.json(entries);
  },
);

taskTimeRouter.post(
  "/time-entries",
  async (req: Request<TaskParams>, res: Response) => {
    const task = await findOwnedTask(req.params.id, req.userId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const parsed = createTimeEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.userId,
        taskId: task.id,
        startedAt: parsed.data.startedAt,
        endedAt: parsed.data.endedAt,
        durationSeconds: durationSeconds(parsed.data.startedAt, parsed.data.endedAt),
      },
    });
    res.status(201).json(entry);
  },
);

taskTimeRouter.delete(
  "/time-entries/:entryId",
  async (req: Request<TaskParams & { entryId: string }>, res: Response) => {
    const task = await findOwnedTask(req.params.id, req.userId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const entry = await prisma.timeEntry.findFirst({
      where: { id: req.params.entryId, taskId: task.id },
    });
    if (!entry) {
      return res.status(404).json({ error: "Time entry not found" });
    }

    await prisma.timeEntry.delete({ where: { id: entry.id } });
    res.status(204).send();
  },
);
