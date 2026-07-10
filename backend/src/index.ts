import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { currentUser } from "./middleware/currentUser";
import { habitsRouter } from "./routes/habits";
import { completionsRouter } from "./routes/completions";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(currentUser);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/habits", habitsRouter);
app.use("/api/habits/:id/completions", completionsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
