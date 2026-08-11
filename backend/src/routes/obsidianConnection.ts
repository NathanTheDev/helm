import { Router } from "express";
import { createObsidianConnectionSchema } from "../validation/obsidianConnection";
import { getStatus, saveConnection, testConnection, disconnect } from "../services/obsidianMcp";

export const obsidianConnectionRouter = Router();

obsidianConnectionRouter.get("/", async (req, res) => {
  res.json(await getStatus(req.userId));
});

obsidianConnectionRouter.post("/", async (req, res) => {
  const parsed = createObsidianConnectionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  res.status(201).json(await saveConnection(req.userId, parsed.data));
});

obsidianConnectionRouter.post("/test", async (req, res) => {
  res.json(await testConnection(req.userId));
});

obsidianConnectionRouter.delete("/", async (req, res) => {
  await disconnect(req.userId);
  res.status(204).send();
});
