import { Router } from "express";
import { chatRequestSchema } from "../validation/ai";
import { chat } from "../services/aiChat";
import { getStatus } from "../services/obsidianMcp";

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res) => {
  const parsed = chatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const reply = await chat(req.userId, parsed.data.messages);
    const { connected } = await getStatus(req.userId);
    res.json({ reply, vaultConnected: connected });
  } catch (err) {
    if (err instanceof Error && err.message === "ANTHROPIC_API_KEY is not set") {
      return res.status(503).json({ error: "AI assistant is not configured on this server" });
    }
    throw err;
  }
});
