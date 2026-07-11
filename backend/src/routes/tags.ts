import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../db/client";
import { createTagSchema, updateTagSchema } from "../validation/task";

// /api/tags — tag CRUD
export const tagsRouter = Router();
// /api/tasks/:id — attach/detach a tag to a task
export const taskTagsRouter = Router({ mergeParams: true });

type TaskParams = { id: string; tagId: string };

tagsRouter.get("/", async (req, res) => {
  const tags = await prisma.tag.findMany({
    where: { userId: req.userId },
    orderBy: { name: "asc" },
  });
  res.json(tags);
});

tagsRouter.post("/", async (req, res) => {
  const parsed = createTagSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const tag = await prisma.tag.create({
    data: { ...parsed.data, userId: req.userId },
  });
  res.status(201).json(tag);
});

tagsRouter.patch("/:id", async (req, res) => {
  const parsed = updateTagSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const existing = await prisma.tag.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Tag not found" });
  }
  const tag = await prisma.tag.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(tag);
});

tagsRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.tag.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Tag not found" });
  }
  await prisma.tag.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

taskTagsRouter.post(
  "/tags/:tagId",
  async (req: Request<TaskParams>, res: Response) => {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    const tag = await prisma.tag.findFirst({
      where: { id: req.params.tagId, userId: req.userId },
    });
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    const link = await prisma.taskTag.upsert({
      where: { taskId_tagId: { taskId: task.id, tagId: tag.id } },
      create: { taskId: task.id, tagId: tag.id },
      update: {},
    });
    res.status(201).json(link);
  },
);

taskTagsRouter.delete(
  "/tags/:tagId",
  async (req: Request<TaskParams>, res: Response) => {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    await prisma.taskTag.deleteMany({
      where: { taskId: task.id, tagId: req.params.tagId },
    });
    res.status(204).send();
  },
);
