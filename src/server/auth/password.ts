import { hash, verify, type Options } from "@node-rs/argon2";

/**
 * Password hashing & policy (SPEC-0001 §6.2).
 * Algoritma: argon2id (rekomendasi OWASP 2024).
 */

/**
 * `Algorithm` pada @node-rs/argon2 dideklarasikan sebagai `const enum`, yang tidak
 * dapat diakses saat runtime dengan `isolatedModules`. Nilai `Argon2id` = 2 sesuai
 * definisi upstream (0=Argon2d, 1=Argon2i, 2=Argon2id).
 */
export const ARGON2ID = 2;

const ARGON2_OPTIONS: Options = {
  algorithm: ARGON2ID,
  memoryCost: 19_456, // 19 MiB (OWASP minimum)
  timeCost: 2,
  parallelism: 1,
};

export const PASSWORD_MIN_LENGTH = 10;

/**
 * 100 password paling umum (subset) yang selalu ditolak.
 * Referensi: daftar publik seperti SecLists / NordPass.
 */
export const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  "123456", "123456789", "12345678", "password", "qwerty", "12345", "1234567",
  "1234567890", "111111", "123123", "abc123", "1234567890", "password1",
  "iloveyou", "000000", "qwerty123", "zaq12wsx", "dragon", "sunshine",
  "princess", "letmein", "654321", "monkey", "27653", "1qaz2wsx", "123321",
  "qwertyuiop", "superman", "asdfghjkl", "1q2w3e4r", "1qaz2wsx3edc",
  "1234qwer", "qazwsx", "qazwsxedc", "michael", "football", "baseball",
  "welcome", "jesus", "ninja", "mustang", "password123", "admin", "admin123",
  "root", "toor", "pass", "test", "guest", "master", "hello", "freedom",
  "whatever", "trustno1", "starwars", "computer", "shadow", "pokemon",
  "matrix", "secret", "access", "flower", "banana", "orange", "chocolate",
  "summer", "winter", "spring", "autumn", "january", "february", "march",
  "april", "june", "july", "august", "september", "october", "november",
  "december", "indonesia", "jakarta", "bandung", "surabaya", "garuda",
  "merahputih", "pancasila", "bismillah", "terima", "kasih", "cinta",
  "sayang", "keluarga", "kantor", "produksi", "quality", "mantaris",
  "plasess", "tokai", "qms", "qms2026", "password1234", "administrator",
]);

export interface PasswordPolicyResult {
  ok: boolean;
  /** Kode alasan (dipetakan ke i18n di layer UI). */
  errors: PasswordPolicyError[];
}

export type PasswordPolicyError =
  | "TOO_SHORT"
  | "NO_LETTER"
  | "NO_DIGIT"
  | "COMMON_PASSWORD"
  | "SAME_AS_USERNAME";

/**
 * Validasi kekuatan password.
 * @param password password mentah
 * @param username opsional — password tidak boleh sama dengan username
 */
export function validatePasswordPolicy(
  password: string,
  username?: string,
): PasswordPolicyResult {
  const errors: PasswordPolicyError[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) errors.push("TOO_SHORT");
  if (!/[A-Za-z]/.test(password)) errors.push("NO_LETTER");
  if (!/[0-9]/.test(password)) errors.push("NO_DIGIT");

  const normalized = password.toLowerCase().trim();
  if (COMMON_PASSWORDS.has(normalized)) errors.push("COMMON_PASSWORD");
  if (username && normalized === username.toLowerCase().trim()) {
    errors.push("SAME_AS_USERNAME");
  }

  return { ok: errors.length === 0, errors };
}

/** Hash password dengan argon2id. */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Verifikasi password terhadap hash.
 * Tidak pernah melempar error untuk input salah — mengembalikan false.
 */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}

