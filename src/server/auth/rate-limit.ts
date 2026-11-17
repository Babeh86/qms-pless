import { config } from "@/lib/config";

/**
 * Rate limiter in-memory (sliding window).
 *
 * Catatan: implementasi ini per-proses. Untuk deployment multi-instance,
 * ganti backend ke Redis tanpa mengubah antarmuka (SPEC-0001 Fase 2).
 */

interface Bucket {
  /** Timestamp (ms) setiap hit dalam window. */
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  /** Sisa kuota pada window saat ini. */
  remaining: number;
  /** Waktu (ms epoch) sampai kuota tersedia kembali. */
  resetAt: number;
  /** Detik sampai boleh mencoba lagi (untuk header Retry-After). */
  retryAfterSeconds: number;
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
  now?: Date;
}

/** Membersihkan bucket yang sudah tidak relevan (mencegah memory leak). */
function sweep(nowMs: number, windowMs: number): void {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    const newest = bucket.hits[bucket.hits.length - 1] ?? 0;
    if (nowMs - newest > windowMs) buckets.delete(key);
  }
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { key, limit, windowMs } = options;
  const nowMs = (options.now ?? new Date()).getTime();
  const windowStart = nowMs - windowMs;

  sweep(nowMs, windowMs);

  const bucket = buckets.get(key) ?? { hits: [] };
  // buang hit di luar window
  bucket.hits = bucket.hits.filter((t) => t > windowStart);

  const allowed = bucket.hits.length < limit;

  if (allowed) {
    bucket.hits.push(nowMs);
    buckets.set(key, bucket);
  } else {
    buckets.set(key, bucket);
  }

  const oldest = bucket.hits[0] ?? nowMs;
  const resetAt = oldest + windowMs;
  const retryAfterSeconds = Math.max(0, Math.ceil((resetAt - nowMs) / 1000));

  return {
    allowed,
    remaining: Math.max(0, limit - bucket.hits.length),
    resetAt,
    retryAfterSeconds,
  };
}

/** Rate limit login per IP. */
export function checkLoginRateLimitByIp(ip: string, now?: Date): RateLimitResult {
  return checkRateLimit({
    key: `login:ip:${ip}`,
    limit: config.login.rateLimitPerMinute,
    windowMs: 60_000,
    ...(now ? { now } : {}),
  });
}

/** Rate limit login per username (mencegah enumerasi akun). */
export function checkLoginRateLimitByUsername(username: string, now?: Date): RateLimitResult {
  return checkRateLimit({
    key: `login:user:${username.toLowerCase()}`,
    limit: config.login.rateLimitUsernamePerMinute,
    windowMs: 60_000,
    ...(now ? { now } : {}),
  });
}

/** Reset seluruh bucket — HANYA untuk pengujian. */
export function __resetRateLimitForTests(): void {
  buckets.clear();
}

/** Menghitung waktu berakhir lockout setelah percobaan gagal. */
export function computeLockoutUntil(
  failedAttempts: number,
  now: Date = new Date(),
): Date | null {
  if (failedAttempts < config.login.maxAttempts) return null;
  return new Date(now.getTime() + config.login.lockoutMinutes * 60_000);
}
