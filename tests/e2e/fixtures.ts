import { test as base, expect, type Page } from "@playwright/test";

/**
 * Fixture E2E: login memakai akun seed (SPEC-0001 §9).
 * Pastikan `npm run db:seed` sudah dijalankan pada database dev.
 */

export const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "Qms#2026Dev";

export async function login(page: Page, username: string, password = SEED_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByRole("button", { name: /masuk|sign in/i }).click();
}

export const test = base;
export { expect };
