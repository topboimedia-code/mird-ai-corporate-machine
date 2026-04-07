import { test, expect } from "@playwright/test";

test.describe("F01 — Monorepo Smoke Tests", () => {
  test("dashboard placeholder page renders", async ({ page }) => {
    await page.goto("/");
    const heading = page.getByTestId("rainmachine-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("RainMachine");
  });

  test("no console errors on page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    expect(errors).toHaveLength(0);
  });

  test("page title is set", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/RainMachine/);
  });
});
