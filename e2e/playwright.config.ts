import { defineConfig, devices } from "@playwright/test";

// Use a separate port for E2E tests locally so we don't conflict with a dev server
const E2E_FRONTEND_PORT = process.env.CI ? 3000 : 3001;

// Local E2E uses a dedicated "kombass" database to avoid polluting dev data
const LOCAL_DATABASE_URL = "postgresql://kombass@localhost:5432/kombass";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${E2E_FRONTEND_PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Start backend and frontend before running tests
  webServer: [
    {
      command: "npm start",
      cwd: "../server",
      url: "http://localhost:9000",
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
      env: process.env.CI ? {} : { DATABASE_URL: LOCAL_DATABASE_URL },
    },
    {
      command: `VITE_TEST_MODE=true npx vite --port ${E2E_FRONTEND_PORT}`,
      cwd: "../frontend",
      url: `http://localhost:${E2E_FRONTEND_PORT}`,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
