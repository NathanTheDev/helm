import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../db/client";
import { createTaskSchema, updateTaskSchema } from "../validation/task";

// Nested under a project: /api/projects/:projectId/tasks
export const projectTasksRouter = Router({ mergeParams: true });
// Top-level by task id: /api/tasks/:id
export const tasksRouter = Router();

type ProjectParams = { projectId: string };

// Phase 1: passthrough. Phases 2/3 extend with computed time/tags/subtasks.
function serializeTask<T>(task: T) {
  return task;
}

async function findOwnedProject(projectId: string, userId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId } });
}

async function findOwnedTask(taskId: string, userId: string) {
  return prisma.task.findFirst({ where: { id: taskId, userId } });
}

projectTasksRouter.get(
  "/",
  async (req: Request<ProjectParams>, res: Response) => {
    const project = await findOwnedProject(req.params.projectId, req.userId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
      orderBy: [{ status: "asc" }, { position: "asc" }],
    });
    res.json(tasks.map(serializeTask));
  },
);

projectTasksRouter.post(
  "/",
  async (req: Request<ProjectParams>, res: Response) => {
    const project = await findOwnedProject(req.params.projectId, req.userId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const status = parsed.data.status ?? "BACKLOG";
    // Append to the end of the target column.
    const max = await prisma.task.aggregate({
      where: { projectId: project.id, status },
      _max: { position: true },
    });
    const position = (max._max.position ?? 0) + 1;

    const task = await prisma.task.create({
      data: {
        ...parsed.data,
        status,
        position,
        projectId: project.id,
        userId: req.userId,
      },
    });
    res.status(201).json(serializeTask(task));
  },
);

tasksRouter.get("/:id", async (req, res) => {
  const task = await findOwnedTask(req.params.id, req.userId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.json(serializeTask(task));
});

tasksRouter.patch("/:id", async (req, res) => {
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await findOwnedTask(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: "Task not found" });
  }

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(serializeTask(task));
});

tasksRouter.delete("/:id", async (req, res) => {
  const existing = await findOwnedTask(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: "Task not found" });
  }

  await prisma.task.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
