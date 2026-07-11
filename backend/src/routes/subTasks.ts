import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../db/client";
import {
  createSubTaskSchema,
  updateSubTaskSchema,
} from "../validation/task";

// /api/tasks/:id/subtasks — list + create under a task
export const subTasksNestedRouter = Router({ mergeParams: true });
// /api/subtasks/:id — update + delete by id
export const subTasksRouter = Router();

type TaskParams = { id: string };

async function findOwnedTask(taskId: string, userId: string) {
  return prisma.task.findFirst({ where: { id: taskId, userId } });
}

subTasksNestedRouter.get(
  "/subtasks",
  async (req: Request<TaskParams>, res: Response) => {
    const task = await findOwnedTask(req.params.id, req.userId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    const subTasks = await prisma.subTask.findMany({
      where: { taskId: task.id },
      orderBy: { position: "asc" },
    });
    res.json(subTasks);
  },
);

subTasksNestedRouter.post(
  "/subtasks",
  async (req: Request<TaskParams>, res: Response) => {
    const task = await findOwnedTask(req.params.id, req.userId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    const parsed = createSubTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const max = await prisma.subTask.aggregate({
      where: { taskId: task.id },
      _max: { position: true },
    });
    const position = (max._max.position ?? 0) + 1;

    const subTask = await prisma.subTask.create({
      data: { taskId: task.id, title: parsed.data.title, position },
    });
    res.status(201).json(subTask);
  },
);

// Ownership on a sub-task is inherited from its parent task's userId.
async function findOwnedSubTask(subTaskId: string, userId: string) {
  return prisma.subTask.findFirst({
    where: { id: subTaskId, task: { userId } },
  });
}

subTasksRouter.patch("/:id", async (req, res) => {
  const parsed = updateSubTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const existing = await findOwnedSubTask(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: "Sub-task not found" });
  }
  const subTask = await prisma.subTask.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(subTask);
});

subTasksRouter.delete("/:id", async (req, res) => {
  const existing = await findOwnedSubTask(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: "Sub-task not found" });
  }
  await prisma.subTask.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
