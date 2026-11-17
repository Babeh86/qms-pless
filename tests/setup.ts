/**
 * Setup global untuk Vitest.
 * Menyediakan env minimal agar modul server bisa diimpor tanpa DB.
 */
const env = process.env as Record<string, string | undefined>;

env.NODE_ENV = env.NODE_ENV ?? "test";

// Arahkan DATABASE_URL ke database test agar kode aplikasi & helper
// memakai database yang sama.
const TEST_DATABASE_URL =
  env.TEST_DATABASE_URL ??
  "postgresql://qms:qms_dev_password@localhost:5432/qms_test?schema=public";
env.DATABASE_URL = TEST_DATABASE_URL;

env.SESSION_COOKIE_NAME = env.SESSION_COOKIE_NAME ?? "qms_session";
env.SESSION_ABSOLUTE_HOURS = env.SESSION_ABSOLUTE_HOURS ?? "12";
env.SESSION_IDLE_MINUTES = env.SESSION_IDLE_MINUTES ?? "60";
env.LOGIN_MAX_ATTEMPTS = env.LOGIN_MAX_ATTEMPTS ?? "5";
env.LOGIN_LOCKOUT_MINUTES = env.LOGIN_LOCKOUT_MINUTES ?? "15";
env.LOGIN_RATE_LIMIT_PER_MINUTE = env.LOGIN_RATE_LIMIT_PER_MINUTE ?? "5";
env.LOGIN_RATE_LIMIT_USERNAME_PER_MINUTE = env.LOGIN_RATE_LIMIT_USERNAME_PER_MINUTE ?? "20";
