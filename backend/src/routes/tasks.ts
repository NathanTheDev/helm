import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../db/client";
import { createTaskSchema, updateTaskSchema } from "../validation/task";
import { taskTotals, type TimeEntryLike } from "../services/timeTracking";

// Nested under a project: /api/projects/:projectId/tasks
export const projectTasksRouter = Router({ mergeParams: true });
// Top-level by task id: /api/tasks/:id
export const tasksRouter = Router();

type ProjectParams = { projectId: string };

// Include this on task reads so serializeTask can compute/flatten relations.
const taskInclude = {
  timeEntries: true,
  subTasks: { orderBy: { position: "asc" } },
  tags: { include: { tag: true } },
} as const;

// Merge computed time fields, flatten tags, and surface sub-tasks. Estimate/
// due-date are plain columns already carried through in ...rest.
function serializeTask<
  T extends {
    timeEntries: TimeEntryLike[];
    tags: { tag: unknown }[];
    subTasks: unknown[];
  },
>(task: T) {
  const { timeEntries, tags, subTasks, ...rest } = task;
  return {
    ...rest,
    ...taskTotals(timeEntries),
    tags: tags.map((t) => t.tag),
    subTasks,
  };
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
      include: taskInclude,
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
      include: taskInclude,
    });
    res.status(201).json(serializeTask(task));
  },
);

tasksRouter.get("/:id", async (req, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: taskInclude,
  });
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
    include: taskInclude,
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
