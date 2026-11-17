# ISSUE-0002d — Engine Import / Export Excel (semua master + relasi otomatis)

| Atribut | Nilai |
|---|---|
| ID | ISSUE-0002d |
| Induk | ISSUE-0002 (dipecah — disetujui 2026-01-30) |
| Tipe | `FEATURE` |
| Prioritas | `P0` |
| Status | `PLANNED` — **DISETUJUI** (2026-01-30) |
| Terkait PRD | **FR-02a AC1–AC14** (import/export), **Q11**, **Q13** |
| Dependensi | ISSUE-0002a, ISSUE-0002b, ISSUE-0002c |
| Estimasi | **L** — 3 hari |

## 1. Latar Belakang
PRD **Q11**: *"semua master data bisa di-import dari Excel dan otomatis menjadi relasi di sistem."*
Admin perlu menambah ratusan record tanpa mengetik satu-satu. PRD **Q13**: referensi yang belum ada
**tidak** dibuat otomatis — harus manual, dengan status `PENDING_RELATION`.

## 2. Ruang Lingkup

**A. Engine generik** (satu implementasi, dipakai 5 master):
- Definisi *entity schema* deklaratif: kolom, tipe, wajib, enum, kolom relasi.
- Wizard 3 langkah: **Upload → Preview → Hasil**.
- Download template `.xlsx` (header baku + contoh baris + sheet "Petunjuk").
- Mode: `CREATE_ONLY` | `UPSERT` (kunci = `code`/`part_no`/`machine_no`).
- Mode kesalahan: `PARTIAL` (default) | `ALL_OR_NOTHING`.
- Laporan hasil `.xlsx` per baris (`OK` | `UPDATED` | `WARNING` | `FAILED` | `PENDING_RELATION`).

**B. Resolusi relasi otomatis (Q11)**
- Kolom relasi: `material_code`, `supplier_code`, `customer_code`, `partner_code`, `plant_code`.
- Referensi ditemukan → relasi dibuat.
- Referensi **tidak** ditemukan → status `PENDING_RELATION`, **tidak** auto-create (Q13);
  daftar referensi hilang ditampilkan + tautan ke form master + tombol **"Coba Lagi"**.

**C. Validasi urutan dependensi**
- Partner → Material → Part → Mesin. Diberi peringatan bila urutan dilanggar.

**D. Export round-trip**
- Export master `.xlsx` dengan format identik template → diedit → diimport ulang.

**E. Riwayat import**
- `ImportJob`: user, waktu, entitas, nama file, mode, jumlah total/ok/update/warning/failed,
  path file asli (retensi 30 hari), path laporan hasil.

## 3. Kriteria Penerimaan
- [ ] AC1: Template Excel tersedia untuk Partner, Material, Part, Mesin, Plant.
- [ ] AC2: Preview menampilkan baris valid (hijau) & error (merah + alasan) sebelum commit.
- [ ] AC3: Mode `CREATE_ONLY` menolak duplikat; `UPSERT` memperbarui.
- [ ] AC4: `PARTIAL` menyimpan baris valid dan melaporkan yang gagal; `ALL_OR_NOTHING` membatalkan semua.
- [ ] AC5: Import Part dengan `material_code` + `supplier_code` valid → **relasi terbentuk otomatis** (T20).
- [ ] AC6: Referensi tak dikenal → `PENDING_RELATION`, **tidak** membuat record otomatis (T23);
      tombol "Coba Lagi" berhasil setelah master dilengkapi.
- [ ] AC7: Batas 5.000 baris/file; >500 baris dijalankan async dengan progres.
- [ ] AC8: Laporan hasil `.xlsx` dapat diunduh.
- [ ] AC9: Export → import ulang (round-trip) tanpa error dan tanpa duplikasi.
- [ ] AC10: `ImportJob` tercatat + masuk Audit Trail (user, file, jumlah).
- [ ] AC11: File asli disimpan 30 hari.
- [ ] AC12: Import **tidak** pernah menimpa data transaksi/checksheet.
- [ ] AC13: Test: unit (parser, validator, resolver relasi), integration (import Part dengan relasi), E2E (wizard).

## 4. Dampak Teknis
- Skema: `ImportJob`, enum `ImportStatus`, `ImportMode`, `ImportFailureMode`.
- Library: **`exceljs`** (baca/tulis, pertahankan format & merge).
- API: `GET /api/import/{entity}/template`, `POST /api/import/{entity}/preview`,
  `POST /api/import/{entity}/commit`, `GET /api/import/jobs`, `GET /api/export/{entity}`.
- Async: queue (BullMQ/Redis) untuk file > 500 baris.
- UI: `/master/import` (wizard), `/master/import/history`.

## 5. Risiko
| Risiko | Dampak | Mitigasi |
|---|---|---|
| File besar membuat server lambat | Tinggi | Async job + batas 5.000 baris |
| Relasi menggantung (`PENDING_RELATION`) menumpuk | Sedang | Halaman resolve + tombol "Coba Lagi" + laporan |
| Format Excel user berubah-ubah (kolom bergeser) | Sedang | Validasi header ketat + pesan jelas per kolom |
| Import dobel karena klik berulang | Sedang | Idempotency key per upload + tombol disabled saat proses |
| Encoding/karakter khusus (`⌀`, `±`) rusak | Sedang | UTF-8 BOM pada template; test round-trip |

## 6. Keputusan Dibutuhkan (Spec)
| # | Pertanyaan | Usulan |
|---|---|---|
| Q1 | Threshold async | >500 baris |
| Q2 | Idempotency | Hash file + `entity` sebagai key 10 menit |
| Q3 | Simpan file asli berapa lama | 30 hari, lalu hapus otomatis |
| Q4 | Auto-code untuk baris tanpa `code` | Tidak — `code` wajib di import (beda dengan quick-add) |
| Q5 | Rollback per batch | P2 (Q14) |

## 7. Gerbang
- [x] **Review user disetujui** — 2026-01-30 → `docs/spec/SPEC-0002d.md`

