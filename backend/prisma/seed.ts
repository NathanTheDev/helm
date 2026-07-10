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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
