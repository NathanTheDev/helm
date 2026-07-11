import { Router } from "express";
import { prisma } from "../db/client";
import { worklog } from "../services/timeTracking";

export const worklogRouter = Router();

worklogRouter.get("/", async (req, res) => {
  const entries = await prisma.timeEntry.findMany({
    where: { userId: req.userId },
    orderBy: { startedAt: "asc" },
  });
  res.json(worklog(entries));
});
