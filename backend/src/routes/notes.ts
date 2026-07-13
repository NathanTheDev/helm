import { Router } from "express";
import { prisma } from "../db/client";
import { createNoteSchema, updateNoteSchema } from "../validation/note";

export const notesRouter = Router();

notesRouter.get("/", async (req, res) => {
  const notes = await prisma.note.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: "desc" },
  });
  res.json(notes);
});

notesRouter.post("/", async (req, res) => {
  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const note = await prisma.note.create({
    data: { ...parsed.data, userId: req.userId },
  });
  res.status(201).json(note);
});

notesRouter.get("/:id", async (req, res) => {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }
  res.json(note);
});

notesRouter.patch("/:id", async (req, res) => {
  const parsed = updateNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Note not found" });
  }

  const note = await prisma.note.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(note);
});

notesRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Note not found" });
  }

  await prisma.note.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
