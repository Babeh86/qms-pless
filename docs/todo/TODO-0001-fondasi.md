# TODO-0001 — Implementasi Fondasi Proyek

| Atribut | Nilai |
|---|---|
| ID | TODO-0001 |
| Plan | PLAN-0001 (approved 2026-01-30) |
| Issue | ISSUE-0001 |
| Spec | SPEC-0001 |
| Status | `APPROVED` — siap dikerjakan |
| Tanggal | 2026-01-30 |

Aturan: satu checkbox = satu task atomik selesai & terverifikasi dalam ≤ 4 jam.
Setiap task ditutup dengan test terkait (tidak menunggu M7).

---

## Milestone M1 — Skeleton & Tooling

- [ ] **T1.** Init Next.js 15 (App Router) + TypeScript `strict` + path alias `@/*`
  — DoD: `npm run dev` jalan, halaman placeholder tampil.
- [ ] **T2.** Setup Tailwind CSS v4 + shadcn/ui init + tema dasar (warna, radius, font)
  — DoD: komponen `Button`, `Input`, `Card` dapat dirender.
- [ ] **T3.** ESLint + Prettier + rule `no-literal-string` untuk JSX
  — DoD: `npm run lint` lulus; string hardcode memicu warning/error.
- [ ] **T4.** Vitest (unit/integration) + Playwright (e2e) + script `test`, `test:e2e`, `typecheck`
  — DoD: 1 test contoh lulus di masing-masing runner.

## Milestone M2 — Database & Skema Inti

- [ ] **T5.** `docker-compose.yml` (PostgreSQL 16) + `.env.example`
  — DoD: `docker compose up -d` → DB sehat.
- [ ] **T6.** Prisma init + `schema.prisma` inti: `Plant`, `User`, `UserRole`, `Session`, `AuditLog`
  + semua enum (`RoleCode`, `AuditAction`) sesuai SPEC-0001 §3
  — DoD: `prisma validate` & `prisma format` lulus.
- [ ] **T7.** Migrasi awal + migrasi SQL trigger `audit_logs` append-only
  — DoD: `prisma migrate dev` sukses; test raw SQL: UPDATE/DELETE pada `audit_logs` **gagal**.
- [ ] **T8.** Prisma client singleton + `seed.ts` idempotent (1 plant, 6 user, 6 role mapping)
  — DoD: `npm run db:seed` dua kali berturut-turut tanpa error/duplikasi.

## Milestone M3 — Auth & Session

- [ ] **T9.** `server/auth/password.ts` — argon2id hash/verify + password policy (min 10, huruf+angka, tolak top-100 & == username)
  — DoD: unit test policy & hash/verify lulus.
- [ ] **T10.** `server/auth/session.ts` — buat/validasi/revoke session, token disimpan sebagai SHA-256, sliding expiry + absolut 12 jam
  — DoD: unit test create/validate/expire/revoke lulus.
- [ ] **T11.** `server/auth/rate-limit.ts` + lockout (5 gagal → 15 menit)
  — DoD: unit test rate limit & lockout lulus.
- [ ] **T12.** API `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`
  — DoD: integration test sukses/gagal/locked/rate-limited lulus; cookie `HttpOnly; Secure; SameSite=Lax`.

## Milestone M4 — RBAC & Scope Plant

- [ ] **T13.** `server/authz/permissions.ts` — matriks 20 permission × 6 role
  — DoD: unit test 120 kasus lulus.
- [ ] **T14.** `server/authz/guard.ts` — `requirePermission()`, `can()`, `SessionContext.plantIds`, 401/403
  — DoD: unit test guard + scope plant lulus.
- [ ] **T15.** Guard di `(app)/layout.tsx` + middleware redirect ke `/login`
  — DoD: akses tanpa session → redirect; role tak berizin → 403.

## Milestone M5 — UI Shell & i18n

- [ ] **T16.** next-intl config (locale `id` default, `en`) + `messages/id.json`, `messages/en.json` (key `auth.*`, `nav.*`, `common.*`, `audit.*`, `error.*`, `validation.*`)
  — DoD: switch locale berfungsi; 0 warning `no-literal-string`.
- [ ] **T17.** Halaman `/login` (form + error state + i18n)
  — DoD: login sukses redirect ke `/dashboard`.
- [ ] **T18.** Shell: sidebar, topbar, breadcrumb, language switcher
  — DoD: navigasi antar menu berfungsi, responsif tablet.
- [ ] **T19.** Halaman `/dashboard` + `/settings/profile`
  — DoD: menampilkan user & role aktif.

## Milestone M6 — Audit Trail

- [ ] **T20.** `server/audit/audit.ts` — `writeAudit()`, snapshot `actorName`, `summaryKey` + params, fail-closed untuk aksi kritikal
  — DoD: unit test lulus; terpanggil di login/logout.
- [ ] **T21.** `GET /api/audit` (filter `from/to/actorId/entity/action`, paginated) + halaman `/audit` read-only
  — DoD: INSPECTOR mendapat 403; VIEWER/ADMIN dapat membaca & filter.

## Milestone M7 — Hardening, Test Payung & Dokumentasi

- [ ] **T22.** Security headers (HSTS, nosniff, X-Frame-Options, Referrer-Policy, CSP) + `GET /api/health`
  — DoD: header terverifikasi; health mengembalikan status DB.
- [ ] **T23.** `README.md` (setup, env, perintah), `.env.example` lengkap, skrip `db:*`
  — DoD: developer baru dapat menjalankan dari nol mengikuti README.
- [ ] **T24.** Unit test: `can()` 120 kasus + password/session/rate-limit (konsolidasi)
  — DoD: coverage modul `auth` & `authz` ≥ 85%.
- [ ] **T25.** Integration: alur login lengkap + trigger append-only
  — DoD: lulus di CI.
- [ ] **T26.** E2E: login → dashboard → ganti bahasa → logout; akses halaman terlarang → 403
  — DoD: lulus di CI headless.

---

## Verifikasi Akhir

- [ ] `npm run typecheck` lulus
- [ ] `npm run lint` lulus
- [ ] `npm run test` (unit + integration) lulus
- [ ] `npm run test:e2e` lulus
- [ ] Acceptance Criteria ISSUE-0001 (AC1–AC10) diverifikasi satu per satu
- [ ] Review kode selesai
- [ ] Demo ke user

## Gerbang

- [x] **Review user disetujui** (PLAN-0001) — 2026-01-30
- [ ] **Mulai implementasi** → T1
