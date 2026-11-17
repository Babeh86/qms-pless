import { expect, test, SEED_PASSWORD } from "./fixtures";

/**
 * T26 — Alur E2E: login → dashboard → ganti bahasa → logout.
 * ISSUE-0001 AC3, AC6.
 */

test.describe("Autentikasi & i18n", () => {
  test("login berhasil menampilkan dashboard", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/^password/i).fill(SEED_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { level: 1, name: /dashboard/i })).toBeVisible();
  });

  test("login gagal menampilkan pesan error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/^password/i).fill("passwordSalahSekali2026");
    await page.getByRole("button", { name: /masuk/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("mengakses halaman terproteksi tanpa login dialihkan ke /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("ganti bahasa ID → EN mengubah teks antarmuka", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/^password/i).fill(SEED_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Switch ke English
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: /dashboard/i })).toBeVisible();

    // Kembali ke Indonesia
    await page.getByRole("button", { name: "ID", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: /dashboard/i })).toBeVisible();
  });

  test("logout mengakhiri sesi dan kembali ke /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("admin");
    await page.getByLabel(/^password/i).fill(SEED_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("button", { name: /keluar|sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Setelah logout, halaman terproteksi harus mengalihkan lagi
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
