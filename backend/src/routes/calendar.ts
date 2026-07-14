import { Router } from "express";
import { getMockCalendarEvents } from "../services/mockCalendar";

export const calendarRouter = Router();

calendarRouter.get("/", async (_req, res) => {
  res.json({ events: getMockCalendarEvents() });
});
