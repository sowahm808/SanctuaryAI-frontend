import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "npm start",
    url: "http://localhost:4200",
    reuseExistingServer: true,
  },
  use: { baseURL: "http://localhost:4200", trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
