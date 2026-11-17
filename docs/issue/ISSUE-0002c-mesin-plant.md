# ISSUE-0002c — Master Mesin (M/C) & Plant

| Atribut | Nilai |
|---|---|
| ID | ISSUE-0002c |
| Induk | ISSUE-0002 (dipecah — disetujui 2026-01-30) |
| Tipe | `FEATURE` |
| Prioritas | `P0` |
| Status | `PLANNED` — **DISETUJUI** (2026-01-30) |
| Terkait PRD | **FR-03** (Mesin), **FR-04** (Plant) |
| Dependensi | ISSUE-0001 |
| Estimasi | **S** — 1 hari |

## 1. Latar Belakang
CS-05 (Patrol) membutuhkan `M/C No` dan `Cavity`; perilaku form bergantung pada **tipe mesin**
(`shot ke-6` untuk vertikal, `shot ke-11` untuk horizontal — PRD FR-03 AC1). Sedangkan `Plant`
menentukan scope data & branding PDF. `ShiftProfile` (jam operasi) dikelola di ISSUE-0003, tetapi
relasinya ditetapkan di sini sebagai FK nullable.

## 2. Ruang Lingkup
- Entitas `Machine`: `machine_no` (unik per plant), `type`
  (`INJECTION_HORIZONTAL`|`INJECTION_VERTICAL`|`PRESS`|`OTHER`), `tonnage`, `plant_id`,
  `shift_profile_id` (nullable, FK ke ISSUE-0003), `isActive`.
- Entitas `Plant`: `plant_code` (unik), `plant_name`, `address`, `logoUrl`, `timezone`, `isActive`.
- CRUD + list + filter per plant.
- Branding: logo & nama plant dipakai pada kop PDF (dipakai ISSUE-0009).
- Seed: plant `KRW`/`KARAWANG`.

## 3. Kriteria Penerimaan
- [ ] AC1: `machine_no` unik **per plant** (boleh sama di plant berbeda).
- [ ] AC2: `type` mendukung 4 nilai enum; tooltip shot ke-6/ke-11 dapat diturunkan dari `type` (dites).
- [ ] AC3: `shift_profile_id` nullable; diisi di ISSUE-0003 tanpa perubahan skema.
- [ ] AC4: `plant_code` unik; minimal 1 plant aktif.
- [ ] AC5: User hanya melihat mesin pada plant yang diizinkan (scope RBAC).
- [ ] AC6: Deaktivasi mesin/plant tidak merusak checksheet lama.
- [ ] AC7: Semua mutasi tercatat di Audit Trail.
- [ ] AC8: Test: unit (rule shot ke-N per tipe), integration (scope plant), E2E (CRUD mesin).

## 4. Dampak Teknis
- Skema: `Machine`, `Plant` (sudah ada di SPEC-0001) — di sini ditambah relasi `shiftProfileId`.
- UI: `/master/machines`, `/settings/plants`.
- API: `/api/machines`, `/api/machines/[id]`, `/api/plants`, `/api/plants/[id]`.

## 5. Risiko
| Risiko | Dampak | Mitigasi |
|---|---|---|
| `ShiftProfile` belum ada saat SPEC ini dikerjakan | Rendah | FK nullable + UI placeholder sampai ISSUE-0003 |
| Penghapusan plant merusak data | Tinggi | Soft-delete saja; `onDelete: Restrict` |
| Tipe mesin bertambah nanti | Rendah | Enum + `OTHER` sebagai escape hatch |

## 6. Keputusan Dibutuhkan (Spec)
| # | Pertanyaan | Usulan |
|---|---|---|
| Q1 | `tonnage` wajib? | Opsional |
| Q2 | Aturan shot ke-N diturunkan dari `type` atau disimpan per mesin? | Turunan `type` + override opsional |
| Q3 | Logo plant: upload atau URL? | Upload ke storage, simpan path |

## 7. Gerbang
- [x] **Review user disetujui** — 2026-01-30 → `docs/spec/SPEC-0002c.md`

