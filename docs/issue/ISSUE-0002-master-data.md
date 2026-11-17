# ISSUE-0002 — Master Data: Business Partner Modular, Material, Part, Mesin, Plant + Import Excel

| Atribut | Nilai |
|---|---|
| ID | ISSUE-0002 |
| Tipe | `FEATURE` |
| Prioritas | `P0` |
| Status | `SPLIT` — **DISETUJUI & DIPECAH** menjadi 0002a–0002d (2026-01-30) |
| Terkait PRD | FR-01 (Part), FR-02 (Business Partner), FR-02a (Material + Import), FR-03 (Mesin), FR-04 (Plant) |
| Dependensi | **ISSUE-0001** (auth, RBAC, plant, audit trail) |
| Dibuat oleh | Tim QA/QMS |
| Tanggal | 2026-01-30 |
| Disetujui oleh | **User** — 2026-01-30 |

## 1. Latar Belakang

Semua 6 checksheet mengambil data identitas dari master: Part No/Name/Model/Material/Cavity,
Supplier, Customer, Material, dan Mesin. Pada dokumen Excel asli data ini **di-hardcode per file**
sehingga terjadi duplikasi dan ketidakkonsistenan (mis. `PASI` muncul sebagai supplier di CS-01 dan
customer di CS-05; `WEIGHT 1.45` identik di dua part berbeda).

PRD memutuskan master data **terpusat dan modular**, serta seluruhnya dapat diisi/import via Excel (Q11).

## 2. Masalah / Kebutuhan

- Tidak ada sumber tunggal untuk Part, Material, Partner, Mesin → rawan salah ketik & duplikasi.
- Peran Company/Supplier/Customer pada dokumen asli ambiguous (Q6, Q9, Q10).
- Admin perlu menambah ratusan data dari Excel, bukan satu-satu (Q2, Q11).
- Referensi antar master (Part→Material→Partner) harus konsisten otomatis (Q11, Q13).

## 3. Ruang Lingkup

**In scope:**

1. **Business Partner modular** — satu entitas `BusinessPartner` + `BusinessPartnerRole[]`
   (`COMPANY` | `SUPPLIER` | `CUSTOMER`). Peran ganda diperbolehkan (PASI = supplier + customer).
   - Badge peran, filter per peran, dropdown terfilter (FR-02 AC3, AC8, AC9).
   - **Quick-add dari mana pun** + flag `created_via = QUICK_ADD` + daftar "Perlu Dilengkapi" (AC13).
   - `is_system_owner` untuk COMPANY (PLASESS).
2. **Material** — `material_code`, `name`, `grade`, `material_type`, `color`, `size_spec`,
   `additive_masterbatch`, `default_unit`, `partner_ref`, `is_active`.
3. **Part** — `part_no`, `part_name`, `model`, `material_id` (**relasi**), `default_partner`,
   `default_cavity_count`, `mold_code`, `drawing_rev`, `is_active`.
4. **Mesin (M/C)** — `machine_no`, `type`, `tonnage`, `plant`, `shift_profile` (ref ke ShiftProfile;
   ShiftProfile sendiri dibuat di ISSUE-0003 — di sini hanya kolom nullable).
5. **Plant** — `plant_code`, `plant_name`, `address`, `logo`, `timezone`.
6. **Import/Export Excel** untuk: Partner, Material, Part, Mesin, Plant.
   - Download template, upload, preview (valid/error), mode `CREATE_ONLY`/`UPSERT`,
     `PARTIAL`/`ALL_OR_NOTHING`, laporan hasil `.xlsx`.
   - **Resolusi relasi otomatis**; referensi tak dikenal ⇒ `PENDING_RELATION` + dibuat **manual** (Q13).
   - Validasi urutan: Partner → Material → Part → Mesin.
   - Export round-trip (format identik template).
   - `ImportJob` history.
7. **Seed data** dari analisa checksheet: PLASESS, PASI, TRSI, KMPI, YHT, TOKAI RIKA,
   4 material, 4 part.

**Out of scope:**
- Template checksheet (→ ISSUE-0004).
- ShiftProfile CRUD penuh (→ ISSUE-0003); di sini hanya FK nullable.
- Rollback per batch import (Q14 → Fase 2).

## 4. Kriteria Penerimaan

- [ ] AC1: CRUD Business Partner dengan peran jamak; 1 partner bisa `[SUPPLIER, CUSTOMER]` sekaligus.
- [ ] AC2: Dropdown supplier hanya menampilkan role `SUPPLIER`; customer hanya `CUSTOMER`; **semua**
      partner berperan terkait tampil (tanpa blacklist — Q12).
- [ ] AC3: Quick-add partner dari dalam form lain → tersimpan ke master, langsung terpilih, tanpa duplikasi.
- [ ] AC4: Partner hasil quick-add muncul di daftar "Perlu Dilengkapi".
- [ ] AC5: CRUD Material; `partner_ref` hanya boleh menunjuk partner ber-role `SUPPLIER`.
- [ ] AC6: CRUD Part; `material_id` **wajib** relasi ke Material (bukan teks bebas).
- [ ] AC7: CRUD Mesin & Plant; `machine.type` mendukung `INJECTION_HORIZONTAL/VERTICAL/PRESS/OTHER`.
- [ ] AC8: Import Excel tiap master: preview, validasi, mode, laporan hasil, `ImportJob` tercatat.
- [ ] AC9: Import Part dengan `material_code` & `supplier_code` valid → relasi terbentuk otomatis.
- [ ] AC10: Referensi tak dikenal → `PENDING_RELATION`, **tidak** membuat record otomatis;
      tersedia tombol "Coba Lagi" setelah master dilengkapi.
- [ ] AC11: Export master menghasilkan file yang dapat di-import ulang (round-trip) tanpa error.
- [ ] AC12: Deaktivasi master tidak merusak data yang sudah mereferensikannya.
- [ ] AC13: Semua aksi tercatat di Audit Trail (termasuk import: file, jumlah baris, sukses/gagal).
- [ ] AC14: Seed data hasil analisa checksheet tersedia dan dapat di-reset.

## 5. Dampak Teknis

- **Skema DB:** `BusinessPartner`, `BusinessPartnerRole`, `Material`, `Part`, `Machine`, `Plant`,
  `ImportJob`. Index pada `code`, `part_no`, `material_code`, `machine_no`.
- **Relasi kunci:** `Part.material_id → Material`, `Material.partner_ref → BusinessPartner`,
  `Part.default_partner → BusinessPartner`, `Machine.plant → Plant`.
- **API:** CRUD `/api/partners`, `/api/materials`, `/api/parts`, `/api/machines`, `/api/plants`;
  import `/api/import/{entity}` (upload, preview, commit), export `/api/export/{entity}`.
- **UI:** 5 halaman master + wizard import (3 langkah: upload → preview → hasil) + halaman riwayat import.
- **Non-fungsional:** import 5.000 baris < 60 detik (async job), preview < 5 detik untuk 500 baris.

## 6. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Peran ganda membingungkan user | Sedang | Badge peran, filter, peringatan konteks (FR-02 AC9) |
| Import parsial meninggalkan data menggantung (`PENDING_RELATION`) | Sedang | Status jelas + halaman resolve + tombol "Coba Lagi" |
| Urutan import dilanggar | Sedang | Validasi dependensi + rekomendasi urutan |
| Duplikasi partner beda ejaan (`PT. PASI` vs `PASI`) | Tinggi | Normalisasi `name` saat cek duplikat + fuzzy warning |
| Data master lama dari Excel tidak konsisten | Sedang | Seed terkurasi dari `00-analisa-checksheet.md` |

## 7. Estimasi

- Kompleksitas: **XL** → **disarankan dipecah** menjadi:
  - `ISSUE-0002a` Business Partner (modular + quick-add)
  - `ISSUE-0002b` Material + Part
  - `ISSUE-0002c` Mesin + Plant
  - `ISSUE-0002d` Import/Export Excel engine (dipakai a–c)
- Estimasi total: **6–8 hari**

## 8. Keputusan yang Dibutuhkan (Spec)

| # | Pertanyaan | Usulan |
|---|---|---|
| Q1 | Normalisasi `code` partner (uppercase, tanpa spasi)? | Ya, uppercase + trim |
| Q2 | Quick-add minimal: cukup `name` saja atau wajib `code`? | `name` wajib, `code` auto-generate (`SUP-0001`) |
| Q3 | Import dijalankan sinkron atau async (background job)? | Async bila > 500 baris |
| Q4 | Library Excel | `exceljs` (pertahankan format & merge) |
| Q5 | Penyimpanan file import asli | Simpan 30 hari untuk audit |

## 9. Gerbang

- [x] **Review user disetujui** — 2026-01-30 → lanjut ke `docs/spec/SPEC-0002.md` (atau pecahan SPEC per sub-issue)


