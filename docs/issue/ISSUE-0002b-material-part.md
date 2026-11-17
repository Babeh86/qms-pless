# ISSUE-0002b — Master Material & Part (dengan Relasi)

| Atribut | Nilai |
|---|---|
| ID | ISSUE-0002b |
| Induk | ISSUE-0002 (dipecah — disetujui 2026-01-30) |
| Tipe | `FEATURE` |
| Prioritas | `P0` |
| Status | `PLANNED` — **DISETUJUI** (2026-01-30) |
| Terkait PRD | **FR-02a** (Master Material), **FR-01** (Master Part) |
| Dependensi | ISSUE-0001, **ISSUE-0002a** (partner) |
| Estimasi | **M** — 2 hari |

## 1. Latar Belakang
Pada 6 checksheet, `Material` hanya berupa teks bebas yang di-hardcode (mis. `PP BOROUGH BF970A1+PH6728
DIC (MB) BLACK`, `TRPOM11 POM-1C NO.P-9801`, `PA 1300G`, `C1720-XHMB AU`). PRD Q2 memutuskan Material
menjadi **master data tersendiri** agar dapat dikelola & diimport; `Part.material` menjadi **relasi**, bukan teks.

## 2. Ruang Lingkup
- Entitas `Material`: `material_code` (unik), `material_name`, `grade`, `material_type`
  (`RESIN`|`METAL_COIL`|`SHEET`|`OTHER`), `color`, `size_spec`, `additive_masterbatch`,
  `default_unit`, `partner_ref` (→ partner ber-role `SUPPLIER`), `isActive`.
- Entitas `Part`: `part_no` (unik), `part_name`, `model`, **`material_id` (relasi wajib)**,
  `default_partner_id`, `default_cavity_count`, `mold_code`, `drawing_rev`, `isActive`.
- CRUD + list + search untuk keduanya.
- Label material untuk form/PDF **verbatim** (gabungan `material_name` + `additive_masterbatch` + `color`
  sesuai pola yang dikonfigurasi) — PRD FR-02a AC11.
- Seed: 4 material + 4 part dari analisa checksheet.

## 3. Kriteria Penerimaan
- [ ] AC1: `material_code` unik; `partner_ref` hanya boleh menunjuk partner ber-role `SUPPLIER`.
- [ ] AC2: `part_no` unik; `material_id` **wajib** dan harus valid (bukan teks bebas).
- [ ] AC3: `default_cavity_count` default 1; IDS (CS-06) memakai 8.
- [ ] AC4: Label material pada form/PDF identik dengan dokumen asli (dites dengan 4 material seed).
- [ ] AC5: Deaktivasi Material yang dipakai Part → ditolak dengan pesan jelas (atau harus nonaktifkan Part dulu).
- [ ] AC6: Deaktivasi Part tidak merusak checksheet lama.
- [ ] AC7: Seed berisi: `PA1300G`, `C1720-XHMB-AU`, `TRPOM11-POM1C`, `PP-BOROUGH-BF970A1`;
      part `7145-0040-0w`, `730409-5310`, `7176-2680-30`, `7L0990-0280`.
- [ ] AC8: Semua mutasi tercatat di Audit Trail.
- [ ] AC9: Test: unit (validasi relasi, label builder), integration (CRUD Part dengan material), E2E.

## 4. Dampak Teknis
- Skema: `Material`, `Part`, enum `MaterialType`; FK `Part.materialId` (Restrict), `Material.partnerRefId` (Restrict).
- UI: `/master/materials`, `/master/parts`; komponen `MaterialSelect`, `PartSelect`.
- API: `/api/materials`, `/api/materials/[id]`, `/api/parts`, `/api/parts/[id]`.
- **Kompatibilitas:** PRD lama memakai `material` sebagai string pada Part — di sini diganti relasi;
  `form_data` snapshot di checksheet tetap menyimpan **label teks**, sehingga dokumen lama tidak terpengaruh.

## 5. Risiko
| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data material asli tidak konsisten antar form | Sedang | Seed terkurasi dari `00-analisa-checksheet.md` |
| Part tanpa material (data lama) | Sedang | Greenfield; validasi wajib saat create |
| Label gabungan berbeda dari dokumen | Sedang | UAT T2 side-by-side + unit test label builder |

## 6. Keputusan Dibutuhkan (Spec)
| # | Pertanyaan | Usulan |
|---|---|---|
| Q1 | `Part.material_id` wajib atau opsional? | **Wajib** |
| Q2 | Pola label material | `{name} {additive} {color}` dengan spasi, konfigurabel per template |
| Q3 | `default_cavity_count` minimal | 1, maksimum 64 |
| Q4 | Boleh 1 Part punya banyak Material (alternatif)? | Tidak di Fase 1 |

## 7. Gerbang
- [x] **Review user disetujui** — 2026-01-30 → `docs/spec/SPEC-0002b.md`

