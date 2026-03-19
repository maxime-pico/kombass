import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

beforeEach(async () => {
  // Only truncate tables for integration tests (skip for pure unit tests)
  if (process.env.DATABASE_URL) {
    try {
      const db = getPrisma();
      await db.player.deleteMany();
      await db.game.deleteMany();
    } catch {
      // DB not available — unit tests don't need it
    }
  }
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});
