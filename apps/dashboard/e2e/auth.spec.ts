import { test, expect } from "@playwright/test";

test.describe("F03 — Authentication", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("email-input").fill("test@example.com");
    await page.getByTestId("password-input").fill("wrongpassword");
    await page.getByTestId("login-button").click();
    await expect(page.getByTestId("login-error")).toBeVisible();
  });

  test("login page has email, password inputs and submit button", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByTestId("email-input")).toBeVisible();
    await expect(page.getByTestId("password-input")).toBeVisible();
    await expect(page.getByTestId("login-button")).toBeVisible();
  });
});
