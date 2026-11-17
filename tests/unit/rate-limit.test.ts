import { afterEach, describe, expect, it } from "vitest";
import {
  __resetRateLimitForTests,
  checkLoginRateLimitByIp,
  checkLoginRateLimitByUsername,
  checkRateLimit,
  computeLockoutUntil,
} from "@/server/auth/rate-limit";
import { config } from "@/lib/config";

afterEach(() => {
  __resetRateLimitForTests();
});

describe("checkRateLimit()", () => {
  it("mengizinkan selama di bawah batas", () => {
    for (let i = 0; i < 3; i += 1) {
      const result = checkRateLimit({ key: "k", limit: 3, windowMs: 60_000 });
      expect(result.allowed).toBe(true);
    }
  });

  it("menolak setelah batas terlampaui", () => {
    for (let i = 0; i < 3; i += 1) {
      checkRateLimit({ key: "k", limit: 3, windowMs: 60_000 });
    }
    const blocked = checkRateLimit({ key: "k", limit: 3, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("key berbeda memiliki kuota terpisah", () => {
    checkRateLimit({ key: "a", limit: 1, windowMs: 60_000 });
    const other = checkRateLimit({ key: "b", limit: 1, windowMs: 60_000 });
    expect(other.allowed).toBe(true);
  });

  it("mengizinkan kembali setelah window lewat", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    checkRateLimit({ key: "k", limit: 1, windowMs: 1_000, now: start });
    const blocked = checkRateLimit({
      key: "k",
      limit: 1,
      windowMs: 1_000,
      now: new Date(start.getTime() + 500),
    });
    expect(blocked.allowed).toBe(false);

    const allowedAgain = checkRateLimit({
      key: "k",
      limit: 1,
      windowMs: 1_000,
      now: new Date(start.getTime() + 1_500),
    });
    expect(allowedAgain.allowed).toBe(true);
  });
});

describe("checkLoginRateLimitByIp() / ByUsername()", () => {
  it("memakai batas per IP dari config", () => {
    expect(config.login.rateLimitPerMinute).toBeGreaterThan(0);
    let last = checkLoginRateLimitByIp("10.0.0.1");
    for (let i = 1; i < config.login.rateLimitPerMinute; i += 1) {
      last = checkLoginRateLimitByIp("10.0.0.1");
    }
    expect(last.allowed).toBe(true);
    expect(checkLoginRateLimitByIp("10.0.0.1").allowed).toBe(false);
  });

  it("username bersifat case-insensitive", () => {
    let result = checkLoginRateLimitByUsername("Inspector1");
    for (let i = 1; i < config.login.rateLimitUsernamePerMinute; i += 1) {
      result = checkLoginRateLimitByUsername("inspector1");
    }
    expect(result.allowed).toBe(true);
    expect(checkLoginRateLimitByUsername("INSPECTOR1").allowed).toBe(false);
  });
});

describe("computeLockoutUntil()", () => {
  it("mengembalikan null bila belum mencapai batas", () => {
    expect(computeLockoutUntil(1)).toBeNull();
    expect(computeLockoutUntil(config.login.maxAttempts - 1)).toBeNull();
  });

  it("mengembalikan waktu lockout saat batas tercapai", () => {
    const now = new Date("2026-01-01T10:00:00Z");
    const until = computeLockoutUntil(config.login.maxAttempts, now);
    expect(until).not.toBeNull();
    expect(until!.getTime()).toBe(now.getTime() + config.login.lockoutMinutes * 60_000);
  });
});
