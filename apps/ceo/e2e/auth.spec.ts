import { test, expect } from "@playwright/test";

test.describe("F03 — CEO Authentication", () => {
  test("CEO login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("CEO login page shows TOTP verification text", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("TOTP verification required")).toBeVisible();
  });

  test("unauthenticated user is redirected to CEO login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("verify page renders digit inputs", async ({ page }) => {
    await page.goto("/login/verify?challengeId=test-challenge");
    await expect(page.getByTestId("digit-0")).toBeVisible();
    await expect(page.getByTestId("digit-5")).toBeVisible();
    await expect(page.getByTestId("verify-button")).toBeVisible();
  });
});
