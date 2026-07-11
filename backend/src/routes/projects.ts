import { Router } from "express";
import { prisma } from "../db/client";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validation/task";

export const projectsRouter = Router();

projectsRouter.get("/", async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.userId },
    orderBy: { position: "asc" },
  });
  res.json(projects);
});

projectsRouter.get("/:id", async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json(project);
});

projectsRouter.post("/", async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const max = await prisma.project.aggregate({
    where: { userId: req.userId },
    _max: { position: true },
  });
  const position = (max._max.position ?? 0) + 1;

  const project = await prisma.project.create({
    data: { ...parsed.data, userId: req.userId, position },
  });
  res.status(201).json(project);
});

projectsRouter.patch("/:id", async (req, res) => {
  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Project not found" });
  }

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(project);
});

projectsRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Project not found" });
  }

  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
