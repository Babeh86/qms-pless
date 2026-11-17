# ISSUE-0001 — Fondasi Proyek: Next.js + TypeScript + PostgreSQL, Auth, RBAC, i18n

| Atribut | Nilai |
|---|---|
| ID | ISSUE-0001 |
| Tipe | `FEATURE` |
| Prioritas | `P0` |
| Status | `PLANNED` — **DISETUJUI** (2026-01-30) |
| Terkait PRD | §3 Persona & Peran, §7 NFR, §8 Arsitektur Teknologi, FR-04 (Plant), FR-14 (Audit Trail) |
| Dependensi | — (issue pertama) |
| Dibuat oleh | Tim QA/QMS |
| Tanggal | 2026-01-30 |
| Disetujui oleh | **User** — 2026-01-30 |

## 1. Latar Belakang

Sistem QMS akan dibangun dari nol di `E:\CODE\qms pless` (folder masih kosong). Sebelum fitur bisnis
apa pun dapat dikerjakan, dibutuhkan **fondasi teknis** yang mencakup: kerangka aplikasi, koneksi
database, autentikasi, otorisasi berbasis peran, internasionalisasi (ID/EN), serta audit trail dasar.

PRD v1.4 §8 menetapkan stack **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Prisma +
PostgreSQL**, deploy **Docker Compose on-premise**.

## 2. Masalah / Kebutuhan

- Belum ada repositori/kode. Tidak ada tempat menaruh fitur.
- Seluruh 17 FR bergantung pada: user terautentikasi, peran (6 role), dan scope plant.
- PRD mewajibkan **bilingual ID/EN** (§3) — harus dipasang sejak awal agar tidak retrofit mahal.
- PRD FR-14 mewajibkan **audit trail append-only** — skema & mekanismenya harus ada sejak tabel pertama.

## 3. Ruang Lingkup

**In scope:**
- Inisialisasi proyek Next.js 15 (App Router) + TypeScript strict mode.
- Tailwind CSS + shadcn/ui, layout dasar (sidebar, topbar, breadcrumb).
- PostgreSQL via Docker Compose + Prisma (schema awal: `User`, `Role`, `UserRole`, `Plant`, `AuditLog`).
- Autentikasi: login/logout, session cookie, password hashing (argon2/bcrypt), password policy.
- RBAC: 6 role (`ADMIN`, `MD_ADMIN`, `INSPECTOR`, `CHECKED`, `APPROVED`, `VIEWER`) + atribusi per plant.
- Guard server-side: route protection & permission check.
- i18n ID/EN (next-intl) dengan switch bahasa persisten.
- Audit trail engine (append-only, middleware/service) + halaman Audit Trail read-only.
- Seed: 1 plant (`KARAWANG`), 6 user contoh (1 per role).
- Tooling: ESLint, Prettier, Vitest, Playwright, `typecheck` script.

**Out of scope:**
- Business logic checksheet apa pun (→ ISSUE-0004 dst).
- Master data Part/Material/Business Partner (→ ISSUE-0002).
- Notifikasi email (→ Fase 2).

## 4. Kriteria Penerimaan

- [ ] AC1: `npm run dev` menjalankan aplikasi; `npm run build` & `npm run typecheck` lulus tanpa error.
- [ ] AC2: `docker compose up` menyalakan PostgreSQL; `prisma migrate dev` membuat skema awal.
- [ ] AC3: User dapat login/logout; password ter-hash; session kedaluwarsa sesuai konfigurasi.
- [ ] AC4: 6 role tersedia; user yang tidak berizin mendapat 403 (server-side, bukan hanya UI).
- [ ] AC5: User hanya dapat melihat data plant yang diizinkan (scope teruji).
- [ ] AC6: Seluruh teks UI tampil dalam ID & EN; switch bahasa persisten setelah reload.
- [ ] AC7: Setiap aksi CRUD & login tercatat di `AuditLog` (append-only, tidak bisa diedit/dihapus).
- [ ] AC8: Halaman Audit Trail menampilkan log dengan filter user/tanggal/entitas, read-only.
- [ ] AC9: Test: minimal 1 test unit, 1 integration (auth), 1 E2E (login → dashboard → logout).
- [ ] AC10: `.env.example`, README setup, dan skrip seed tersedia.

## 5. Dampak Teknis

- **Skema DB:** `User`, `Role`, `UserRole(user, role, plant)`, `Plant`, `Session`, `AuditLog`.
- **API:** `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`, `GET /api/audit`.
- **UI:** `/login`, `/dashboard`, `/audit`, `/settings/profile`, language switcher.
- **Non-fungsional:** password policy, rate limit login, HTTPS-ready, header keamanan (CSP dasar).

## 6. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Retrofitting i18n setelah banyak halaman | Tinggi | Pasang next-intl sejak issue ini; larang string hardcode via ESLint rule |
| Audit trail bisa dimutasi | Sedang | Tidak ada endpoint update/delete; trigger DB melarang UPDATE/DELETE |
| RBAC tersebar & tidak konsisten | Sedang | Satu modul `authz` terpusat + test per role |
| Prisma vs Drizzle masih terbuka | Rendah | Putuskan di SPEC-0001; PRD mengizinkan keduanya |

## 7. Estimasi

- Kompleksitas: **L**
- Estimasi: **3–4 hari**

## 8. Keputusan yang Dibutuhkan (Spec)

| # | Pertanyaan | Usulan |
|---|---|---|
| Q1 | ORM: Prisma atau Drizzle? | **Prisma** (migrasi & DX matang, tim mudah) |
| Q2 | Library auth: Auth.js vs custom? | **Custom session** (kontrol penuh, tanpa dependency berat) |
| Q3 | Password hashing | **argon2id** |
| Q4 | Session storage | DB session (bukan JWT) agar bisa revoke |

## 9. Gerbang

- [x] **Review user disetujui** — 2026-01-30 → lanjut ke `docs/spec/SPEC-0001.md`

