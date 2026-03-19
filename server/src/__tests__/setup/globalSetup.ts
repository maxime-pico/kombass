import { execSync } from "child_process";

export default async function globalSetup() {
  // Use test database
  process.env.DATABASE_URL = process.env.DATABASE_URL?.replace(
    /\/[^/]+$/,
    "/kombass_test"
  ) || "postgresql://kombass:kombass@localhost:5432/kombass_test";

  // Reset test database schema
  execSync("npx prisma db push --force-reset --skip-generate", {
    cwd: __dirname + "/../../../",
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: "pipe",
  });
}
