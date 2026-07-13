import { Router } from "express";
import crypto from "crypto";
import { prisma } from "../db/client";
import { createNoteSchema, updateNoteSchema } from "../validation/note";
import { createExternalNote } from "../services/notesCollab";

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

// Owner always; a non-owner may load a *published* note too - that's the
// "anyone with the link" sharing model (see the publish endpoint below).
// Unpublished notes stay invisible to everyone but their owner.
notesRouter.get("/:id", async (req, res) => {
  const note = await prisma.note.findFirst({
    where: {
      id: req.params.id,
      OR: [{ userId: req.userId }, { published: true }],
    },
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

// Owner-only. Idempotent: publishing an already-published note just
// returns it as-is rather than creating a second collaborative session and
// orphaning the first.
notesRouter.post("/:id/publish", async (req, res) => {
  const existing = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Note not found" });
  }
  if (existing.published) {
    return res.json(existing);
  }

  let externalNote;
  try {
    externalNote = await createExternalNote(existing.content);
  } catch (err) {
    console.error(`Failed to publish note ${existing.id}:`, err);
    return res.status(502).json({ error: "Failed to reach the notes collaboration service" });
  }

  const note = await prisma.note.update({
    where: { id: existing.id },
    data: {
      published: true,
      shareToken: crypto.randomBytes(16).toString("hex"),
      externalDocId: externalNote.id,
      publishedAt: new Date(),
    },
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
