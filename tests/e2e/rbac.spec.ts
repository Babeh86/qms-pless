import { expect, test, SEED_PASSWORD } from "./fixtures";

/**
 * T26 — Otorisasi: role tanpa `audit.read` mendapat 403 (ISSUE-0001 AC4).
 */

test.describe("Otorisasi halaman audit", () => {
  test("VIEWER dapat membuka halaman Audit Trail", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("viewer1");
    await page.getByLabel(/^password/i).fill(SEED_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const response = await page.goto("/audit");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("INSPECTOR ditolak (403) saat membuka halaman Audit Trail", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("inspector1");
    await page.getByLabel(/^password/i).fill(SEED_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const response = await page.goto("/audit");
    expect(response?.status()).toBe(403);
  });

  test("API /api/audit menolak INSPECTOR dengan 403", async ({ page, request }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("inspector1");
    await page.getByLabel(/^password/i).fill(SEED_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const response = await request.get("/api/audit", {
      headers: { cookie: cookieHeader },
    });
    expect(response.status()).toBe(403);
  });

  test("API /api/audit menolak permintaan tanpa sesi dengan 401", async ({ request }) => {
    const response = await request.get("/api/audit");
    expect(response.status()).toBe(401);
  });
});
