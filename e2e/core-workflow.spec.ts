import { test, expect } from "@playwright/test";
test("sign in, create campaign, edit sermon and schedule social content", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await page.getByLabel("Email address").fill("pastor@church.org");
  await page.getByLabel("Password").fill("secure-password");
  await page.getByRole("button", { name: "Continue securely" }).click();
  await expect(page.getByText("Ministry command center")).toBeVisible();
  await page.getByRole("link", { name: /Monthly Campaigns/ }).click();
  await page.getByLabel("Spiritual focus").fill("Grace for enlargement");
  await page.getByLabel("Main scripture").fill("Isaiah 54:2");
  await page.getByRole("button", { name: /Generate all/ }).click();
  await page.getByRole("link", { name: /Sermons/ }).click();
  await expect(page.getByRole("textbox")).toBeVisible();
  await page.getByRole("link", { name: /Social Publisher/ }).click();
  await page.getByRole("button", { name: "Schedule" }).click();
  await expect(page.getByText("Scheduled", { exact: true })).toBeVisible();
});
