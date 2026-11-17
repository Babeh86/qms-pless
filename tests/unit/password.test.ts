import { describe, expect, it } from "vitest";
import {
  COMMON_PASSWORDS,
  PASSWORD_MIN_LENGTH,
  hashPassword,
  validatePasswordPolicy,
  verifyPassword,
} from "@/server/auth/password";

describe("validatePasswordPolicy()", () => {
  it("menerima password yang memenuhi syarat", () => {
    const result = validatePasswordPolicy("Rahasia2026aman");
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("menolak password terlalu pendek", () => {
    const result = validatePasswordPolicy("Ab1");
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("TOO_SHORT");
  });

  it("menolak password tanpa huruf", () => {
    const result = validatePasswordPolicy("1234567890");
    expect(result.errors).toContain("NO_LETTER");
  });

  it("menolak password tanpa angka", () => {
    const result = validatePasswordPolicy("abcdefghij");
    expect(result.errors).toContain("NO_DIGIT");
  });

  it("menolak password umum (case-insensitive)", () => {
    expect(validatePasswordPolicy("PASSWORD").errors).toContain("COMMON_PASSWORD");
    expect(COMMON_PASSWORDS.has("password")).toBe(true);
  });

  it("menolak password yang sama dengan username", () => {
    const result = validatePasswordPolicy("inspector1", "inspector1");
    expect(result.errors).toContain("SAME_AS_USERNAME");
  });

  it(`panjang minimum adalah ${PASSWORD_MIN_LENGTH}`, () => {
    expect(validatePasswordPolicy("a1".repeat(PASSWORD_MIN_LENGTH / 2) + "b").ok).toBe(true);
    expect(validatePasswordPolicy("abcdefgh1").errors).toContain("TOO_SHORT");
  });
});

describe("hashPassword() / verifyPassword()", () => {
  it("menghasilkan hash argon2id yang dapat diverifikasi", async () => {
    const hash = await hashPassword("Rahasia2026aman");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "Rahasia2026aman")).toBe(true);
    expect(await verifyPassword(hash, "salah")).toBe(false);
  });

  it("menghasilkan hash berbeda untuk password yang sama (salt acak)", async () => {
    const [a, b] = await Promise.all([
      hashPassword("Rahasia2026aman"),
      hashPassword("Rahasia2026aman"),
    ]);
    expect(a).not.toBe(b);
  });

  it("mengembalikan false untuk hash tidak valid (tidak melempar)", async () => {
    await expect(verifyPassword("bukan-hash", "apa pun")).resolves.toBe(false);
  });
});
