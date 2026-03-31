import { execSync } from "child_process";
import path from "path";

const LOCAL_DATABASE_URL = "postgresql://kombass@localhost:5432/kombass";

export default async function globalSetup() {
  if (process.env.CI) return; // CI starts with a clean DB

  const serverDir = path.resolve(__dirname, "../server");
  try {
    execSync(
      `DATABASE_URL="${LOCAL_DATABASE_URL}" npx prisma db execute --stdin <<< 'DELETE FROM "Player"; DELETE FROM "Game";'`,
      { cwd: serverDir, stdio: "pipe", shell: "/bin/zsh" }
    );
    console.log("[global-setup] Cleared stale Game/Player rows");
  } catch (e) {
    console.warn("[global-setup] DB cleanup failed (DB may not be running):", (e as Error).message);
  }
}
