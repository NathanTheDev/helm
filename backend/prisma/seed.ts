import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_USER_ID } from "../src/middleware/currentUser";
import { addDays, toDayStart } from "../src/utils/date";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const today = toDayStart(new Date());

// Build completion rows for the given day-offsets back from today.
function completions(offsets: number[], quantityProgress?: number) {
  return {
    create: offsets.map((offset) => ({
      completedAt: addDays(today, -offset),
      ...(quantityProgress !== undefined ? { quantityProgress } : {}),
    })),
  };
}

const userId = DEFAULT_USER_ID;

async function seedTasks() {
  // Idempotent: wipe projects (tasks/entries/subtasks/tasktags cascade) + tags.
  await prisma.project.deleteMany({ where: { userId } });
  await prisma.tag.deleteMany({ where: { userId } });

  const research = await prisma.tag.create({
    data: { userId, name: "research", color: "#4f6d7a" },
  });
  const frontend = await prisma.tag.create({
    data: { userId, name: "frontend", color: "#c9633e" },
  });
  const urgent = await prisma.tag.create({
    data: { userId, name: "urgent", color: "#b08a3e" },
  });

  const site = await prisma.project.create({
    data: { userId, name: "Website Redesign", color: "#c9633e", position: 1 },
  });
  const personal = await prisma.project.create({
    data: { userId, name: "Personal", color: "#6f7d5c", position: 2 },
  });

  const now = new Date();
  // A completed time entry starting `startHour` on the day `dayOffset` back.
  const dayEntry = (dayOffset: number, startHour: number, durationMin: number) => {
    const start = new Date(addDays(today, dayOffset).getTime() + startHour * 3600000);
    return {
      userId,
      startedAt: start,
      endedAt: new Date(start.getTime() + durationMin * 60000),
      durationSeconds: durationMin * 60,
    };
  };

  await prisma.task.create({
    data: {
      userId, projectId: site.id, title: "Audit current pages",
      status: "BACKLOG", position: 1,
      tags: { create: [{ tagId: research.id }] },
    },
  });
  await prisma.task.create({
    data: {
      userId, projectId: site.id, title: "Gather brand assets",
      status: "BACKLOG", position: 2,
    },
  });

  await prisma.task.create({
    data: {
      userId, projectId: site.id, title: "Wireframe home",
      status: "TODO", position: 1,
      estimateMinutes: 120, dueDate: addDays(today, 2),
      tags: { create: [{ tagId: research.id }] },
      subTasks: {
        create: [
          { title: "Hero section", done: true, position: 1 },
          { title: "Nav", done: false, position: 2 },
          { title: "Footer", done: false, position: 3 },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      userId, projectId: site.id, title: "Build nav component",
      status: "IN_PROGRESS", position: 1, estimateMinutes: 90,
      tags: { create: [{ tagId: frontend.id }, { tagId: urgent.id }] },
      timeEntries: {
        create: [
          dayEntry(-1, 10, 45),
          dayEntry(0, 9, 30),
          // currently running (no endedAt)
          { userId, startedAt: new Date(now.getTime() - 12 * 60000) },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      userId, projectId: site.id, title: "Set up repo",
      status: "DONE", position: 1,
      timeEntries: { create: [dayEntry(-2, 14, 30)] },
    },
  });

  await prisma.task.create({
    data: {
      userId, projectId: personal.id, title: "Plan weekend trip",
      status: "TODO", position: 1, dueDate: addDays(today, 5),
    },
  });
  await prisma.task.create({
    data: {
      userId, projectId: personal.id, title: "Renew passport",
      status: "BACKLOG", position: 1,
      tags: { create: [{ tagId: urgent.id }] },
    },
  });

  const projects = await prisma.project.count({ where: { userId } });
  const tasks = await prisma.task.count({ where: { userId } });
  console.log(`Seeded ${projects} projects, ${tasks} tasks for ${userId}.`);
}

async function main() {
  // Idempotent: wipe this user's habits (completions cascade) then reseed.
  await prisma.habit.deleteMany({ where: { userId: DEFAULT_USER_ID } });

  await prisma.habit.create({
    data: {
      userId: DEFAULT_USER_ID,
      name: "Reading",
      emoji: "📚",
      frequency: "DAILY",
      quantity: 1,
      // 12-day daily streak, including today.
      completions: completions([...Array(12).keys()]),
    },
  });

  await prisma.habit.create({
    data: {
      userId: DEFAULT_USER_ID,
      name: "Morning walk",
      emoji: "🚶",
      frequency: "DAILY",
      quantity: 1,
      // Missed yesterday and today — streak broken.
      completions: completions([2, 3, 4, 5]),
    },
  });

  await prisma.habit.create({
    data: {
      userId: DEFAULT_USER_ID,
      name: "Water",
      emoji: "💧",
      frequency: "DAILY",
      quantity: 8,
      // Countable: full on past days, partway through today.
      completions: {
        create: [
          { completedAt: addDays(today, -2), quantityProgress: 8 },
          { completedAt: addDays(today, -1), quantityProgress: 8 },
          { completedAt: today, quantityProgress: 3 },
        ],
      },
    },
  });

  await prisma.habit.create({
    data: {
      userId: DEFAULT_USER_ID,
      name: "Weekly review",
      emoji: "🗓️",
      frequency: "WEEKLY",
      quantity: 1,
      // One completion in each of the last few weeks.
      completions: completions([1, 8, 15]),
    },
  });

  const count = await prisma.habit.count({ where: { userId: DEFAULT_USER_ID } });
  console.log(`Seeded ${count} habits for ${DEFAULT_USER_ID}.`);

  await seedTasks();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
