import { Router } from "express";
import { buildAuthUrl, isConnected, getUpcomingEvents, disconnect } from "../services/googleCalendar";

export const calendarRouter = Router();

calendarRouter.get("/", async (req, res) => {
  const events = await getUpcomingEvents(req.userId);
  if (events === null) {
    return res.json({ events: [], connected: false });
  }
  res.json({ events, connected: true });
});

calendarRouter.get("/status", async (req, res) => {
  res.json({ connected: await isConnected(req.userId) });
});

calendarRouter.get("/oauth/start", async (req, res) => {
  res.json({ url: buildAuthUrl(req.userId) });
});

calendarRouter.delete("/connection", async (req, res) => {
  await disconnect(req.userId);
  res.status(204).send();
});
