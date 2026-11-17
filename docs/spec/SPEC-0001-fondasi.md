# SPEC-0001 — Fondasi Proyek: Stack, Skema Inti, Auth, RBAC, i18n, Audit Trail

| Atribut | Nilai |
|---|---|
| ID | SPEC-0001 |
| Issue | ISSUE-0001 (disetujui 2026-01-30) |
| Status | `APPROVED` — 2026-01-30 (Q1–Q4 disetujui user) |
| Versi | 1.0 |
| Tanggal | 2026-01-30 |

---

## 1. Ringkasan Pendekatan

Membangun fondasi aplikasi monolit modular Next.js (App Router) dengan pemisahan lapisan yang tegas:

```
app/            → routing & UI (Server Components default, Client bila perlu interaksi)
server/
  auth/         → session, password, rate limit
  authz/        → RBAC terpusat (can(), requirePermission())
  audit/        → audit trail append-only
  db/           → Prisma client (singleton)
  i18n/         → konfigurasi next-intl
prisma/         → schema & migrations
lib/            → util bersama
messages/       → id.json, en.json
tests/          → unit, integration, e2e
```

**Prinsip kunci:** otorisasi **selalu** di server. UI hanya menyembunyikan, bukan mengamankan.

### Keputusan teknis (menjawab §8 ISSUE-0001)

| # | Keputusan | Pilihan | Alasan | Alternatif ditolak |
|---|---|---|---|---|
| Q1 | ORM | **Prisma 6** | Migrasi deklaratif, `prisma client` type-safe, ekosistem matang | Drizzle (lebih ringan tapi migrasi relasi kompleks lebih manual) |
| Q2 | Auth | **Custom, session berbasis DB** | Perlu revoke paksa, multi-plant, audit login, tanpa dependensi eksternal | Auth.js (abstraksi berlebih untuk kebutuhan ini) |
| Q3 | Password hash | **argon2id** (`node-argon2`) | Rekomendasi OWASP 2024 | bcrypt (batas 72 byte, lebih lemah) |
| Q4 | Session | **DB session + cookie `HttpOnly; Secure; SameSite=Lax`** | Bisa revoke, bisa lihat perangkat aktif | JWT (tidak bisa revoke tanpa blacklist) |
| Q5 | i18n | **next-intl** | Cocok App Router, server+client, messages JSON | i18next (boilerplate lebih besar) |
| Q6 | UI | **Tailwind v4 + shadcn/ui** | Copy-in component, tidak terikat versi | MUI/AntD (bundle besar, sulit dikustom) |

---

## 2. Struktur Direktori (target)

```
qms-pless/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx            ← sidebar + topbar + guard
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ audit/page.tsx
│  │  │  └─ settings/profile/page.tsx
│  │  ├─ api/
│  │  │  ├─ auth/login/route.ts
│  │  │  ├─ auth/logout/route.ts
│  │  │  ├─ me/route.ts
│  │  │  └─ audit/route.ts
│  │  ├─ layout.tsx               ← provider i18n/theme
│  │  └─ globals.css
│  ├─ server/
│  │  ├─ auth/{session.ts,password.ts,rate-limit.ts,login.ts}
│  │  ├─ authz/{permissions.ts,guard.ts}
│  │  ├─ audit/{audit.ts}
│  │  ├─ db/client.ts
│  │  └─ i18n/{config.ts,request.ts}
│  ├─ components/{ui/,layout/,shared/}
│  ├─ lib/{validation/,utils/}
│  └─ messages/{id.json,en.json}
├─ prisma/{schema.prisma,migrations/,seed.ts}
├─ tests/{unit/,integration/,e2e/}
├─ docker-compose.yml
├─ .env.example
└─ README.md
```

---

## 3. Desain Data (Prisma — subset fondasi)

> Tabel master (BusinessPartner, Material, Part, Machine) → SPEC-0002. Di sini hanya yang dibutuhkan fondasi.

```prisma
// ─────────── Enum ───────────
enum RoleCode {
  ADMIN        // administrator sistem (semua akses)
  MD_ADMIN     // admin master data
  INSPECTOR    // QC inspector
  CHECKED      // QC supervisor / verifier
  APPROVED     // QC manager
  VIEWER       // auditor / read-only
}

enum AuditAction {
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGOUT
  CREATE
  UPDATE
  DELETE
  SOFT_DELETE
  SUBMIT
  APPROVE
  REJECT
  EXPORT
  IMPORT
  VIEW
}

// ─────────── Plant ───────────
model Plant {
  id          String   @id @default(cuid())
  code        String   @unique              // "KRW"
  name        String                        // "KARAWANG"
  address     String?
  logoUrl     String?
  timezone    String   @default("Asia/Jakarta")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       UserRole[]
  sessions    Session[]
  auditLogs   AuditLog[]

  @@map("plants")
}

// ─────────── User ───────────
model User {
  id             String    @id @default(cuid())
  username       String    @unique
  email          String    @unique
  fullName       String
  passwordHash   String
  isActive       Boolean   @default(true)
  lastLoginAt    DateTime?
  failedAttempts Int       @default(0)
  lockedUntil    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  roles          UserRole[]
  sessions       Session[]
  auditLogs      AuditLog[]

  @@index([isActive])
  @@map("users")
}

// ─────────── UserRole (user × role × plant) ───────────
model UserRole {
  id        String   @id @default(cuid())
  userId    String
  role      RoleCode
  plantId   String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  plant     Plant    @relation(fields: [plantId], references: [id], onDelete: Restrict)

  @@unique([userId, role, plantId])
  @@index([plantId, role])
  @@map("user_roles")
}

// ─────────── Session ───────────
model Session {
  id           String   @id                       // opaque token (hashed)
  userId       String
  plantId      String?
  ipAddress    String?
  userAgent    String?
  expiresAt    DateTime
  revokedAt    DateTime?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  plant        Plant?   @relation(fields: [plantId], references: [id])

  @@index([userId, expiresAt])
  @@map("sessions")
}

// ─────────── AuditLog (append-only) ───────────
model AuditLog {
  id          BigInt      @id @default(autoincrement())
  at          DateTime    @default(now())
  actorId     String?
  actorName   String?                         // snapshot, tetap ada walau user dihapus
  plantId     String?
  action      AuditAction
  entity      String                          // "User", "Part", ...
  entityId    String?
  summary     String                          // human readable, sudah ter-i18n key + params
  metadata    Json?                           // diff / payload
  ipAddress   String?
  userAgent   String?

  actor       User?       @relation(fields: [actorId], references: [id], onDelete: SetNull)
  plant       Plant?      @relation(fields: [plantId], references: [id])

  @@index([at])
  @@index([actorId, at])
  @@index([entity, entityId])
  @@map("audit_logs")
}
```

### Migrasi & proteksi append-only

Migrasi awal + **trigger PostgreSQL** yang menolak UPDATE/DELETE pada `audit_logs`:

```sql
-- prisma/migrations/xxxx_audit_append_only/migration.sql
CREATE OR REPLACE FUNCTION prevent_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs bersifat append-only (percobaan % ditolak)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
```

- **Dampak data existing:** belum ada data (greenfield) → aman.
- **Retensi:** mengikuti NFR PRD (10 tahun). Purge **tidak** diimplementasi di Fase 1.

---

## 4. Model RBAC

### 4.1 Permission (matrix)

| Permission | ADMIN | MD_ADMIN | INSPECTOR | CHECKED | APPROVED | VIEWER |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| `user.manage` | ✔ | — | — | — | — | — |
| `role.assign` | ✔ | — | — | — | — | — |
| `plant.manage` | ✔ | — | — | — | — | — |
| `numbering.manage` | ✔ | ✔ | — | — | — | — |
| `shift.manage` | ✔ | ✔ | — | — | — | — |
| `master.read` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `master.write` | ✔ | ✔ | — | — | — | — |
| `partner.quickadd` | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| `template.read` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `template.write` | ✔ | ✔ | — | — | — | — |
| `checksheet.create` | ✔ | — | ✔ | — | — | — |
| `checksheet.edit` | ✔ | — | ✔ (miliknya) | — | — | — |
| `checksheet.submit` | ✔ | — | ✔ (miliknya) | — | — | — |
| `checksheet.check` | ✔ | — | — | ✔ | ✔ | — |
| `checksheet.approve` | ✔ | — | — | — | ✔ | — |
| `checksheet.view.all` | ✔ | ✔ | — | ✔ | ✔ | ✔ |
| `checksheet.export` | ✔ | ✔ | ✔ (miliknya) | ✔ | ✔ | ✔ |
| `audit.read` | ✔ | — | — | — | — | ✔ |
| `import.run` | ✔ | ✔ | — | — | — | — |
| `export.master` | ✔ | ✔ | — | — | ✔ | ✔ |

### 4.2 API internal

```ts
// server/authz/permissions.ts
type Action = 'user.manage' | 'master.write' | 'checksheet.approve' | /* ... */;

// server/authz/guard.ts
export async function requirePermission(
  action: Action,
  opts?: { plantId?: string; ownerId?: string }
): Promise<SessionContext>;   // throw ForbiddenError(403) / UnauthenticatedError(401)

export function can(
  ctx: SessionContext,
  action: Action,
  opts?: { plantId?: string; ownerId?: string }
): boolean;
```

- **AC4 (issue):** dijaga oleh `requirePermission` di **setiap** route handler & server action —
  diverifikasi test per role × action.
- **Scope plant** (AC5): `SessionContext.plantIds: string[]`; query otomatis difilter,
  dan `requirePermission` menolak bila `plantId` di luar daftar.

### 4.3 Matriks `role × aksi` — aturan tambahan

- `INSPECTOR` hanya dapat `edit`/`submit` checksheet dengan `inspectorId == ctx.userId`.
- Segregation of duties (PRD FR-11): `checkedBy != inspectorId` dan `approvedBy != checkedBy` — divalidasi di layer checksheet (ISSUE-0008).
- `ADMIN` **tidak** otomatis boleh approve dokumen; ia punya `checksheet.approve` hanya bila juga diberi peran `APPROVED`.

---

## 5. Kontrak API (fondasi)

| Method | Path | Auth | Request | Response | Catatan |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | publik | `{ username, password }` | `200 { user, roles }` + cookie | rate-limited 5/menit/IP; 423 bila `lockedUntil` |
| POST | `/api/auth/logout` | session | — | `204` | revoke session di DB |
| GET | `/api/me` | session | — | `{ user, roles: {role, plantId}[], plantIds }` | — |
| GET | `/api/audit` | `audit.read` | `?from&to&actorId&entity&action&page` | `{ items, total, page }` | read-only, paginated |
| GET | `/api/health` | publik | — | `{ status, db }` | untuk healthcheck docker |

**Konvensi error** (dipakai semua endpoint, termasuk issue berikutnya):

```json
{ "error": { "code": "FORBIDDEN", "messageKey": "error.forbidden", "details": {} } }
```

`code`: `UNAUTHENTICATED`(401) · `FORBIDDEN`(403) · `NOT_FOUND`(404) · `VALIDATION`(422) · `RATE_LIMITED`(429) · `LOCKED`(423) · `INTERNAL`(500)

---

## 6. Logika: Autentikasi & Keamanan

### 6.1 Login flow

```
1. Rate limit cek (5 percobaan/menit per IP; 20/menit per username) → 429
2. Cari user by username → gagal: increment "generic failed" + audit LOGIN_FAILED (tanpa bocor user ada/tidak)
3. Cek isActive & lockedUntil → 423 bila terkunci
4. Verifikasi argon2id → gagal: failedAttempts++, lock 15 menit setelah 5x → audit LOGIN_FAILED
5. Sukses: reset failedAttempts, set lastLoginAt
6. Buat Session (id = 32-byte random base64url, expiresAt = now + 8 jam)
7. Set cookie `qms_session` HttpOnly; Secure; SameSite=Lax; Path=/
8. audit LOGIN_SUCCESS (actor, ip, ua)
```

### 6.2 Password policy

- Minimal 10 karakter, mengandung huruf & angka.
- Tolak 100 password umum teratas (list statis) & password == username.
- Ganti password → revoke semua session lain.

### 6.3 Session

- Sliding expiration: aktivitas memperpanjang hingga **maksimum absolut 12 jam**.
- Logout & ganti password → `revokedAt` diset.
- Cookie name: `qms_session`; nilai = token **mentah**; DB menyimpan **SHA-256** dari token.

### 6.4 Header keamanan (next.config.ts)

`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, CSP dasar (tanpa `unsafe-eval` di production).

---

## 7. i18n

- Locale: `id` (default), `en`. Persistensi: cookie `qms_locale` + `Accept-Language` fallback.
- Messages: `src/messages/id.json`, `en.json` — **nested key**, mis. `auth.login.title`.
- Server Component: `getTranslations()`; Client: `useTranslations()`.
- **Larangan:** string UI literal di JSX — ditegakkan ESLint rule kustom (`no-literal-string`).
- Istilah form asli (`ITEM CHECK`, `STANDARD`, `ACTUAL`, `JUDGMENT`) **tetap** di kedua locale
  (sesuai PRD §3) — didefinisikan sebagai konstanta domain, bukan diterjemahkan bebas.
- Number/date: `Intl` dengan locale aktif; tanggal default `Asia/Jakarta`.

**i18n keys minimal (fondasi):** `auth.*`, `nav.*`, `common.*`, `audit.*`, `error.*`, `validation.*`.

---

## 8. Audit Trail

API tunggal:

```ts
export async function writeAudit(input: {
  action: AuditAction; entity: string; entityId?: string;
  summaryKey: string; summaryParams?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  actor?: { id: string; name: string } | null;
  plantId?: string | null;
  request?: Request;
}): Promise<void>;
```

- Dipanggil di setiap mutasi (route handler / server action), **dalam transaksi yang sama** bila mutasi memakai transaksi.
- `actorName` disimpan sebagai **snapshot** agar log tetap terbaca walau user dihapus.
- `summary` disimpan sebagai key + params, dirender sesuai locale saat dibaca → log bilingual.
- Gagal menulis audit **menggagalkan** mutasi (fail-closed) untuk aksi kritikal
  (`APPROVE`, `REJECT`, `DELETE`, `IMPORT`).

---

## 9. Seed

| Entitas | Isi |
|---|---|
| Plant | `KRW` / `KARAWANG`, `Asia/Jakarta` |
| Role | 6 role enum (tidak perlu row) |
| User | `admin`, `mdadmin`, `inspector1`, `checked1`, `approved1`, `viewer1` — password dari env `SEED_PASSWORD` (default `Qms#2026Dev`, **wajib diganti di production**) |
| UserRole | masing-masing 1 role pada plant `KRW`; `admin` juga `ADMIN` |

Seed bersifat **idempotent** (`upsert`), aman dijalankan berulang (`npm run db:seed`).

---

## 10. Keamanan & Permission — Checklist Verifikasi

- [ ] Semua route `/api/*` selain `login` & `health` memanggil `requireSession()` / `requirePermission()`.
- [ ] Semua halaman `(app)/*` memakai guard di `layout.tsx`.
- [ ] Tidak ada `passwordHash` yang pernah dikirim ke client.
- [ ] `audit_logs` menolak UPDATE/DELETE di level DB.
- [ ] Rate limit teruji.
- [ ] Fetch data ter-scope plant.

---

## 11. Rencana Pengujian

| Level | Skenario | Tool |
|---|---|---|
| Unit | `can()` matrix 6 role × 20 permission (120 kasus), `passwordPolicy`, format `summaryKey` | Vitest |
| Unit | Hash & verify argon2, hashing token session | Vitest |
| Integration | Login sukses/gagal/lockout/rate-limit; logout revoke; `/api/me`; `/api/audit` 403 untuk INSPECTOR | Vitest + Supertest + Testcontainers Postgres |
| Integration | Trigger append-only menolak UPDATE/DELETE | Vitest (raw SQL) |
| E2E | Login → dashboard → ganti bahasa → logout | Playwright |
| E2E | Akses halaman terlarang → 403 | Playwright |

**Definition of Done test:** seluruh test di atas lulus di CI.

---

## 12. Observabilitas

- Log terstruktur (pino) dengan `requestId`, `userId`, `plantId`, `route`, `durationMs`.
- Endpoint `/api/health` mengembalikan status DB.
- (Fase 2) metrik Prometheus; alert error rate.

---

## 13. Migrasi & Rollback

- `prisma migrate deploy` pada container startup (entrypoint).
- Rollback: `prisma migrate resolve --rolled-back` + restore snapshot (greenfield, risiko rendah).
- Feature flag tidak diperlukan untuk issue ini (tidak ada fitur bisnis).

---

## 14. Pertanyaan Terbuka

| # | Pertanyaan | Usulan |
|---|---|---|
| Q5 | Session absolut 12 jam cukup untuk shift 3 (8 jam)? | Cukup; inspector bisa re-login |
| Q6 | Perlukah "Remember me"? | Tidak di Fase 1 |
| Q7 | Multi-plant: 1 user boleh >1 plant? | Ya, sudah didukung `UserRole` per plant |

---

## 15. Gerbang

- [ ] **Review user disetujui** → lanjut ke `docs/plan/PLAN-0001.md`

