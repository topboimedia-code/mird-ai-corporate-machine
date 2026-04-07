/**
 * F04 — Realtime Sync Test Page E2E
 * Scenario 7: Realtime counter updates within 2 seconds of a DB write.
 *
 * Prerequisites:
 *   - Local dev server running (pnpm dev --filter=dashboard)
 *   - Local Supabase running (supabase start)
 *   - Test user seeded and logged in (via storageState auth fixture)
 *   - TEST_TENANT_ID env var set
 */

import { test, expect } from "@playwright/test";

test.describe("F04 — Realtime Sync Test Page", () => {
  test.skip(
    process.env.NODE_ENV === "production",
    "Sync test page is not available in production",
  );

  test("page renders sync-test-panel with initial counters", async ({
    page,
  }) => {
    await page.goto("/dashboard/sync-test");

    await expect(page.getByTestId("sync-test-panel")).toBeVisible();
    await expect(page.getByTestId("leads-total")).toBeVisible();
    await expect(page.getByTestId("appointments-set")).toBeVisible();
  });

  test("realtime counter updates within 2 seconds of a DB write", async ({
    page,
  }) => {
    await page.goto("/dashboard/sync-test");
    await expect(page.getByTestId("sync-test-panel")).toBeVisible();

    const initialValue = await page.getByTestId("leads-total").textContent();

    // Trigger a metrics upsert via the test utility endpoint.
    // This simulates what n8n does after a successful lead upsert.
    const triggerRes = await page.request.post(
      "/api/test/trigger-metrics-upsert",
    );
    expect(triggerRes.ok()).toBe(true);

    // Realtime event must arrive within 2 seconds (PRD Scenario 7 acceptance criterion)
    await expect(page.getByTestId("last-realtime-event")).toBeVisible({
      timeout: 2000,
    });

    // Counter must have changed (not necessarily +1 — rollup recalculates the whole day)
    const updatedValue = await page.getByTestId("leads-total").textContent();
    expect(updatedValue).not.toBe(initialValue);
  });

  test("no JavaScript errors on the sync-test page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/dashboard/sync-test");
    await expect(page.getByTestId("sync-test-panel")).toBeVisible();

    expect(errors).toHaveLength(0);
  });
});
