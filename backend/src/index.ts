import "./env";
import express from "express";
import cors from "cors";
import { currentUser } from "./middleware/currentUser";
import { habitsRouter } from "./routes/habits";
import { completionsRouter } from "./routes/completions";
import { projectsRouter } from "./routes/projects";
import { projectTasksRouter, tasksRouter } from "./routes/tasks";
import { taskTimeRouter } from "./routes/timeEntries";
import { worklogRouter } from "./routes/worklog";
import { tagsRouter, taskTagsRouter } from "./routes/tags";
import { subTasksNestedRouter, subTasksRouter } from "./routes/subTasks";
import { notesRouter } from "./routes/notes";
import { calendarRouter } from "./routes/calendar";
import {
  tablesRouter,
  tableFieldsRouter,
  fieldsRouter,
  tableRowsRouter,
  rowsRouter,
} from "./routes/tables";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(currentUser);

app.use("/api/habits", habitsRouter);
app.use("/api/habits/:id/completions", completionsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects/:projectId/tasks", projectTasksRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/tasks/:id", taskTimeRouter);
app.use("/api/tasks/:id", taskTagsRouter);
app.use("/api/tasks/:id", subTasksNestedRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/subtasks", subTasksRouter);
app.use("/api/worklog", worklogRouter);
app.use("/api/notes", notesRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/tables", tablesRouter);
app.use("/api/tables/:tableId/fields", tableFieldsRouter);
app.use("/api/fields", fieldsRouter);
app.use("/api/tables/:tableId/rows", tableRowsRouter);
app.use("/api/rows", rowsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
