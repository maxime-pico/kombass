import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
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
    },
    {
      command: "REACT_APP_TEST_MODE=true BROWSER=none npm start",
      cwd: "../frontend",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
