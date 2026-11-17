# PRD — QC Management System (QMS)

| Atribut | Nilai |
|---|---|
| Nama Produk | **QMS — Quality Control Management System** |
| Versi Dokumen | 1.6 (**Final** — Q1–Q14 + Shift & Jadwal Kerja modular, shift tetap tanpa rotasi) |
| Status | Siap Direview Ulang & Approval |
| Pemilik Produk | PT. Plasess Indonesia (Quality Assurance Dept.) |
| Repositori | `E:\CODE\qms pless` |
| Basis analisa | `docs/00-analisa-checksheet.md` (ekstraksi 6 checksheet dari `Master Format Check Sheet TAB`) |
| Referensi visual | qm.mantaris.id — **tidak dapat diakses model**, struktur disusun ulang dari analisa checksheet + praktik QMS umum |

**Alur kerja dokumen (disepakati):**
`Issue → Spec → Plan → Todo → Implementasi`
Tidak ada kode ditulis sebelum Issue & Plan disetujui. Lihat §17.

---

## 1. Latar Belakang & Masalah

Saat ini Quality Control dijalankan memakai **6 checksheet Excel/PDF** terpisah:

| Kode | Nama Form | Jenis | Doc No |
|---|---|---|---|
| CS-01 | Inspection Incoming Material **COLLAR** | Incoming Part | CS-PR-05-QAD-01D/00 |
| CS-02 | Inspection Incoming Material **INSERT** | Incoming Part | CS-PR-05-QAD-01A/04 |
| CS-03 | Check Sheet Incoming Material **PA 1300G** | Incoming Material | CS-PR-05-QAD-01A/06 |
| CS-04 | Materials Incoming Inspection Sheet **PRESS 17M036-0030** | Incoming Material (coil) | CS-PR-05-QAD-01B/00 |
| CS-05 | QC **Patrol** Check Sheet (Injection H/V) | In-process Patrol | CS-PR-07-QAD-237/02 |
| CS-06 | **Inspection Data Sheet (IDS)** 7L0990-0280 | In-process Dimensional | CS-PR-02-ENG-28/01 |

**Masalah yang teridentifikasi dari analisa file:**

1. **Tidak ada traceability** — hasil cek tersebar di file Excel per part; sulit menelusuri riwayat sebuah lot.
2. **Master template tercemar** — kolom `ACTUAL` di CS-01 dan CS-03 sudah terisi nilai contoh
   (`Tidak kotor`, `PA 1300G`, `BLACK`). Risiko inspector menganggapnya sebagai standard.
3. **Tidak ada validasi** — nilai di luar tolerance tetap bisa masuk; tidak ada perhitungan otomatis OK/NG.
4. **Inkonsistensi penomoran** — CS-02 melompat `1.1 → 1. 3` lalu reset `1.1`; CS-05 label chara ⑯⑰ duplikat.
5. **Rekap manual** — judgment final, rasio NG, dan laporan harian dihitung manual.
6. **Approval tidak terlacak** — tanda tangan basah di kertas, sulit diaudit & dicari.
7. **Duplikasi data master** — part, supplier, customer di-hardcode di tiap file (mis. `WEIGHT 1.45 ±0.04`
   muncul di dua part berbeda → indikasi copy-paste antar template).

---

## 2. Tujuan & Metrik Keberhasilan

### 2.1 Tujuan Produk
1. Menyediakan **satu engine template checksheet** yang mampu mereproduksi ke-6 form secara identik isinya.
2. Menghasilkan **PDF 1:1** yang layak untuk arsip & audit, menggantikan kertas/Excel.
3. Menegakkan **validasi & judgment otomatis** berbasis standard + tolerance.
4. Memberikan **alur approval digital berjenjang** dengan jejak audit lengkap.

### 2.2 Metrik Keberhasilan (SMART)

| # | Metrik | Target |
|---|---|---|
| M1 | Waktu pengisian checksheet | **−50%** dibanding manual (baseline diukur di minggu ke-1) |
| M2 | Kelengkapan data saat submit | **100%** field wajib terisi (ditolak sistem jika tidak) |
| M3 | Akurasi judgment OK/NG otomatis vs manual | **100%** dari toleransi numerik terdefinisi |
| M4 | Kesetiaan isi PDF vs form asli | **100%** (verifikasi item-per-item dengan dokumen asli) |
| M5 | Waktu menemukan riwayat lot saat audit | **< 30 detik** (dari sebelumnya puluhan menit) |
| M6 | Adopsi | 100% inspector incoming & patrol memakai sistem dalam 60 hari |

### 2.3 Non-Goals (Fase 1)
- ❌ Modul lain di luar QC (produksi, HR, purchasing, inventory) — lihat §16 Roadmap.
- ❌ Integrasi ERP/MES real-time (hanya siapkan API/webhook titik integrasi).
- ❌ Mobile native app (Fase 1 = web responsif; input tablet sudah cukup).
- ❌ OCR otomatis dari dokumen supplier (Fase 2).
- ❌ SPC/control chart & analisa statistik lanjutan (Fase 2).

---

## 3. Persona & Peran

**Bilingual ID/EN** (UI dapat berganti bahasa; label form asli `ITEM CHECK / DETAIL CHECK / STANDARD /
ACTUAL / JUDGMENT` dipertahankan karena merupakan istilah dokumen resmi).

| Role | Kode | Tanggung Jawab | Hak Utama |
|---|---|---|---|
| Administrator Sistem | `ADMIN` | Konfigurasi sistem, user, master data | Semua akses + pengaturan |
| Admin Master Data | `MD_ADMIN` | Kelola part, supplier, customer, mesin, template | CRUD master data, tanpa approval |
| QC Inspector | `INSPECTOR` | Isi checksheet, ukur, judgment | Create/Edit draft miliknya, submit |
| QC Checked / Supervisor | `CHECKED` | Verifikasi tingkat 1 | Review, checked/uncheck, kembalikan |
| QC Manager / Approved | `APPROVED` | Final approval | Approve/reject, lihat semua laporan |
| Viewer / Auditor | `VIEWER` | Audit & pembacaan | Read-only + export |

**Atribusi RBAC:** `user × role × plant`. Satu user boleh punya > 1 role pada plant berbeda.

---

## 4. Ruang Lingkup Fase 1 (MVP)

### 4.1 In Scope
1. **Engine Template Checksheet** (flat & matrix) — inti sistem.
2. **6 checksheet** persis isi aslinya (CS-01 s.d. CS-06), termasuk normalisasi penomoran.
3. **Input checksheet** dengan validasi, perhitungan OK/NG otomatis, wajib-isi.
4. **Alur approval** Inspector → Checked → Approved, dengan jejak audit.
5. **Export PDF & Excel** dengan layout 1:1.
6. **Master data**: Part, Supplier, Customer, Mesin (M/C), Plant, User, Template, Revisi Dokumen,
   **Pengaturan Penomoran**.
7. **Laporan dasar**: rekap per lot, rekap harian, rasio NG, pencarian & filter.
8. **Multi-plant** (data terisolasi per plant; master part dapat dipakai bersama sesuai izin).

### 4.2 Out of Scope Fase 1
- Semua di §2.3.
- Import otomatis parsing Excel (yang dipakai adalah **seed** data, lihat §12).

---

## 5. Modul & Fungsional Detail

### 5.0 Arsitektur Informasi (Menu)
```
▸ Dashboard
▸ Inspection
    ├─ Incoming          (CS-01, CS-02, CS-03, CS-04)
    ├─ In-Process
    │    ├─ Patrol      (CS-05)
    │    └─ IDS         (CS-06)
    └─ Semua Inspection  (gabungan + filter)
▸ Approval Queue          (Checked / Approved)
▸ Template
    ├─ Check Sheet Template
    ├─ Item Bank         (katalog item check reusable)
    └─ Revisi & Doc Control
▸ Master Data
    ├─ Business Partner (Company / Supplier / Customer — modular) ⭐⭐
    ├─ Material ⭐      ├─ Part
    ├─ Mesin (M/C)      ├─ Plant
    ├─ User & Role
    └─ Import Excel (semua master + relasi otomatis) ⭐
▸ Laporan & Analisa
▸ Pengaturan
    ├─ Penomoran (Numbering Rules) ⭐
    ├─ Shift & Jadwal Kerja (ShiftTemplate, Shift, WorkSchedule) ⭐⭐
    ├─ Toleransi & Judgement
    ├─ Retensi & Arsip ⭐
    ├─ Branding & Blok Tanda Tangan ⭐
    └─ Audit Trail
```

---

### 5.1 FR-01 — Master Part
**Deskripsi:** katalog part dengan atribut yang dibutuhkan 6 form (header form).

| Field | Tipe | Wajib | Catatan |
|---|---|---|---|
| `part_no` | string, unik per plant | ✔ | mis. `7176-2680-30`, `7L0990-0280`, `730409-5310` |
| `part_name` | string | ✔ | mis. `A PILLAR PROTECTOR BASE`, `SLIDER, PT`, `Anchor Through`, `COLLAR` |
| `model` | string | ✖ | mis. `468B`, `D13PF` |
| `material` | string | ✖ | mis. `PP BOROUGH BF970A1+PH6728 DIC (MB) BLACK`, `TRPOM11 POM-1C NO.P-9801` |
| `color` | string | ✖ | mis. `NATURAL`, `BLACK` |
| `grade` | string | ✖ | mis. `1300G`, `C1720-XHMB AU` |
| `material_size` | string | ✖ | mis. `0.15 x 27 x COIL` |
| `drawing_rev` | string | ✖ | mis. `10` |
| `customer` | ref Customer | ✖ | mis. `TRSI`, `PASI` |
| `default_cavity_count` | integer | ✖ | mis. `8` (CS-06), `1` (CS-05) |
| `mold_code` | string | ✖ | mis. `TRSI-0041` |
| `default_supplier` | ref Supplier | ✖ | mis. `PT. PASI`, `PT. Yahata Fastener Indonesia` |
| `is_active` | boolean | ✔ | non-aktif = tetap bisa dibaca untuk data historis |

**AC:**
- AC1: Tidak dapat menghapus part yang sudah dipakai checksheet; hanya bisa `is_active = false`.
- AC2: `part_no` unik per plant; kombinasi sama pada plant lain diizinkan.
- AC3: Pencarian by `part_no` / `part_name` / `model` dengan hasil < 300 ms.

---

### 5.2 FR-02 — Master Business Partner (Company / Supplier / Customer — **Modular**) ⭐⭐

> **Koreksi & keputusan terbaru (Q6, Q9, Q10):**
> - **Q6:** TRSI adalah **supplier**, PLASESS adalah **penerima barang**.
> - **Q10:** `PT. TOKAI RIKA SAFETY INDONESIA` juga **supplier** → di form menjadi **pilihan supplier**,
>   bukan pihak sisi-kiri yang berdiri sendiri.
> - **Q9:** *"saya ingin semuanya modular, baik pemakai sistem ini sebagai company, supplier, dan customer
>   semuanya modular bisa di-setting oleh user sesuai kebutuhan. Jadi nanti bisa dipilih bebas customer-nya
>   siapa atau supplier-nya siapa."*
>
> **Implikasi:** Company, Supplier, dan Customer **BUKAN tiga tabel terpisah**, melainkan **satu entitas
> `BusinessPartner` dengan `role[]` (many-to-many)**. Satu record bisa berperan sebagai Supplier
> **sekaligus** Customer — persis menyelesaikan ambiguitas PASI/TRSI pada dokumen asli.

**Model: satu entitas, banyak peran**

```
BusinessPartner (1) ──── (N) BusinessPartnerRole (role: COMPANY | SUPPLIER | CUSTOMER)
        │                             └─ atribut spesifik peran (JSON/kolom opsional)
        ├─ relasi ke Part (supplier_default, customer_default, material_supplier)
        └─ relasi ke Checksheet (supplier_id, customer_id, company_id — semua menunjuk ke partner)
```

**A. `BusinessPartner`** (inti — dipakai semua peran)

| Field | Tipe | Wajib | Contoh |
|---|---|---|---|
| `code` | string, unik | ✔ | `PLASESS`, `PASI`, `TRSI`, `KMPI`, `YHT` |
| `name` | string | ✔ | `PT. PLASESS INDONESIA`, `PT. PASI`, `TRSI`, `PT. KMPI`, `PT. TOKAI RIKA SAFETY INDONESIA` |
| `short_name` | string | ✖ | `PLASESS`, `PASI`, `TRSI` |
| `roles` | array enum | ✔ min. 1 | `COMPANY` \| `SUPPLIER` \| `CUSTOMER` |
| `address`, `city`, `phone`, `email`, `contact_person` | string | ✖ | — |
| `npwp` | string | ✖ | untuk company |
| `logo` | file | ✖ | untuk company (kop PDF) |
| `is_active` | bool | ✔ | — |
| `note` | text | ✖ | — |

**B. Atribut spesifik peran** (`BusinessPartnerRole`)

| Peran | Atribut tambahan | Contoh |
|---|---|---|
| `COMPANY` | `is_system_owner` (bool), `logo`, `npwp`, `signature_block_side` (`LEFT`/`RIGHT`) | `PLASESS` → `is_system_owner = true`, side `RIGHT` |
| `SUPPLIER` | `supplier_type` (`PART`\|`MATERIAL`\|`BOTH`), `lead_time_days`, `certification[]` | `PASI` → `PART`; `KMPI` → `MATERIAL`; `TOKAI RIKA` → `PART` |
| `CUSTOMER` | `customer_type` (`END_CUSTOMER`\|`OEM`\|`TIER1`\|`INTERNAL`) | opsional |

**C. Fleksibilitas pemilihan (inti permintaan Q9)**

- **AC1:** Satu partner **dapat memiliki beberapa peran sekaligus**. Contoh: `PASI` = `[SUPPLIER, CUSTOMER]`
  — muncul di dropdown Supplier **dan** Customer pada form, tanpa duplikasi data.
- **AC2:** Peran dapat **ditambah/dikurangi user kapan saja** dari UI Master Business Partner tanpa
  membuat record baru; perubahan tercatat di audit trail.
- **AC3:** Dropdown pada header checksheet **difilter otomatis berdasarkan peran**:
  field "Supplier Name" hanya menampilkan partner ber-role `SUPPLIER`; "Customer" hanya `CUSTOMER`.
- **AC4:** Semua header form (CS-01..CS-06) memakai **satu sumber data yang sama**, sehingga partner yang
  sudah ada langsung dapat dipilih di form mana pun tanpa input ulang.
- **AC5:** Kombinasi `code` unik secara global; tidak boleh ada dua record dengan `code` sama untuk peran berbeda.
- **AC6:** Peran `COMPANY` wajib ada minimal satu (`is_system_owner = true`); sistem menolak menonaktifkan
  company owner.
- **AC7:** Penghapusan peran **tidak** menghapus record partner (soft) dan tidak mempengaruhi transaksi lama.
- **AC8:** Setiap partner menampilkan **badge peran** (`COMPANY` / `SUPPLIER` / `CUSTOMER`) di list & detail,
  dengan filter cepat per peran.
- **AC9:** Bila ada partner dengan peran ganda, UI menampilkan peringatan konteks
  "Partner ini juga terdaftar sebagai Customer/Supplier" untuk mencegah salah pilih.
- **AC13 — ⭐ Keputusan user (Q12):** **Semua partner dapat ditampilkan** pada dropdown Supplier maupun
  Customer (tidak ada pengecualian/blacklist), **dan** pada dropdown tersebut user dapat
  **menambahkan partner baru secara manual (quick-add)**, lalu sistem otomatis
  **menyimpan/memperbarui ke Master Business Partner**:
  - Quick-add tersedia langsung dari form checksheet (tanpa pindah halaman).
  - Field minimal: `name` (+ `code` opsional; bila kosong dibangkitkan otomatis).
  - Peran otomatis diisi sesuai konteks dropdown (menambah lewat "Supplier" ⇒ role `SUPPLIER` ditambahkan).
  - Jika `name` sudah ada → sistem mencegah duplikasi dan menawarkan **menambahkan peran** ke record
    yang ada, bukan membuat record baru.
  - Hasil quick-add **langsung muncul & terpilih** pada field yang sedang diisi, dan tercatat di audit trail.
  - Partner hasil quick-add ditandai `created_via = QUICK_ADD` agar admin dapat meninjau kelengkapannya
    lewat daftar "Perlu Dilengkapi" di Master Business Partner.

**D. Pemetaan ke field dokumen asli**

| Dokumen | Field asli | Dipetakan ke |
|---|---|---|
| CS-01 | `SUPPLIER NAME` = `PT. PASI` | Partner ber-role `SUPPLIER` (code `PASI`) |
| CS-05 | `Customer : PASI` | Partner **sama** (`PASI`) dengan role `CUSTOMER` juga ditambahkan |
| CS-06 | `CUSTOMER = TRSI` | Partner `TRSI` ber-role `CUSTOMER` **dan** `SUPPLIER` (Q6: TRSI supplier) |
| CS-06 | Blok TTD kiri `PT. TOKAI RIKA SAFETY INDONESIA` | Partner ber-role `SUPPLIER` (Q10) |
| CS-06 | Blok TTD kanan `PT. PLASESS INDONESIA` | Partner ber-role `COMPANY`, `is_system_owner = true` |
| CS-04 | `VENDOR NAME = PT. KMPI` | Partner ber-role `SUPPLIER` (`supplier_type = MATERIAL`) |

- **AC10:** Blok tanda tangan PDF **kiri & kanan keduanya adalah partner** (bukan hardcode teks pada Plant):
  - Sisi `RIGHT` = company owner (penerima, PLASESS) — default.
  - Sisi `LEFT` = partner **supplier** yang dipilih pada checksheet (Q10: TOKAI RIKA).
- **AC11:** `Plant.company_left` (field lama) **dihapus** dari desain; digantikan pilihan Supplier yang
  dapat dikonfigurasi per template (`signature_left_source = SUPPLIER_OF_CHECKSHEET | FIXED_PARTNER`).
- **AC12:** `Mold Code` (`TRSI-0041`) tetap atribut Part; **tidak** lagi diperlakukan sebagai penanda customer.

---

### 5.2a FR-02a — Master Material (dengan Import Excel) ⭐
**Permintaan user (Q2):** *"Material pun diisi di setting master data material, di mana user bisa
menambahkan langsung via file Excel."*

Sebelumnya `material` hanya field teks pada Part. Sekarang menjadi **master data tersendiri** agar
dapat dikelola & diimpor massal.

| Field | Tipe | Wajib | Contoh (dari dokumen) |
|---|---|---|---|
| `material_code` | string, unik | ✔ | `PA1300G`, `C1720-XHMB-AU`, `TRPOM11-POM1C` |
| `material_name` | string | ✔ | `PA 1300G`, `C1720-XHMB AU`, `TRPOM11 POM-1C NO.P-9801` |
| `grade` | string | ✖ | `1300G`, `C1720-XHMB AU` |
| `material_type` | enum | ✔ | `RESIN` \| `METAL_COIL` \| `SHEET` \| `OTHER` |
| `color` | string | ✖ | `BLACK`, `NATURAL` |
| `size_spec` | string | ✖ | `0.15 x 27 x COIL` |
| `additive_masterbatch` | string | ✖ | `+PH6728 DIC (MB)` |
| `default_unit` | string | ✖ | `Kgs.`, `pcs` |
| `supplier_ref` | ref BusinessPartner | ✖ | material ini biasa dari supplier mana (dipilih dari partner ber-role `SUPPLIER`) |
| `is_active` | bool | ✔ | — |

**Import via Excel/CSV (berlaku untuk SEMUA master data — Q11):**
- **AC1:** Tersedia **Download Template Excel** (header baku + contoh baris + sheet "Petunjuk").
- **AC2:** Upload file → **preview tabel** sebelum disimpan: baris valid (hijau), baris error (merah + alasan),
  jumlah `baru` vs `update`.
- **AC3:** Mode `CREATE_ONLY` (tolak duplikat) dan `UPSERT` (perbarui berdasarkan `code`).
- **AC4:** Validasi wajib: `code` & `name` tidak boleh kosong; `code` unik;
  nilai enum harus dikenal; maksimum 5.000 baris per file.
- **AC5:** Baris gagal **tidak** membatalkan seluruh file — mode `PARTIAL` (default) menyimpan baris valid
  dan melaporkan yang gagal; opsi `ALL_OR_NOTHING` tersedia.
- **AC6:** Setelah import, tersedia **file laporan hasil** (`.xlsx`) berisi status per baris.
- **AC7:** Setiap import tercatat di audit trail: user, waktu, nama file, jumlah baris, jumlah sukses/gagal.
- **AC8 — ⭐ Keputusan user (Q11):** *"semua master data bisa di-import dari Excel dan otomatis menjadi
  relasi di sistem."* Import tersedia untuk **seluruh master data**:

| Master | Kolom kunci relasi dalam file Excel |
|---|---|
| **Business Partner** | `code`, `name`, `roles` (dipisah `;` — mis. `SUPPLIER;CUSTOMER`), `supplier_type`, `customer_type` |
| **Material** | `material_code`, `material_name`, `grade`, `supplier_code` → **relasi otomatis** ke Business Partner |
| **Part** | `part_no`, `part_name`, `model`, `material_code` → **relasi otomatis** ke Material, `supplier_code`, `customer_code` |
| **Mesin (M/C)** | `machine_no`, `type`, `tonnage`, `plant_code`, `shift_profile` |
| **Plant** | `plant_code`, `plant_name`, `timezone` |
| **Employee/User** | `username`, `name`, `email`, `role`, `plant_code` |

- **AC9 — Relasi otomatis dari file:** kolom relasi (`material_code`, `supplier_code`, `customer_code`,
  `plant_code`) **diselesaikan otomatis** oleh sistem:
  - Jika referensi **ditemukan** → relasi dibuat.
  - Jika **belum ada** → baris ditandai `WARNING` dan **tidak dibuat otomatis**.
  - **⭐ Keputusan user (Q13):** referensi yang belum ada **harus dibuat manual** (tidak ada
    `AUTO_CREATE`). Sistem menampilkan daftar referensi yang belum terdaftar beserta rekomendasi urutan
    pembuatan, dan menyediakan tautan langsung ke form master terkait (atau quick-add).
    Baris yang bergantung pada referensi tersebut disimpan sebagai `PENDING_RELATION` dan dapat
    di-resolve setelah master dilengkapi (tombol "Coba Lagi").
- **AC10:** Urutan import disarankan & divalidasi: **Business Partner → Material → Part → Mesin**
  (karena dependensi relasi). Sistem memberi peringatan bila urutan dilanggar.
- **AC11:** Import tidak pernah menimpa data transaksi/checksheet yang sudah tersimpan.
- **AC12:** Duplikasi relasi dicegah: `part_no + supplier_code` unik; `material_code + supplier_code` unik.
- **AC13:** Tersedia **Export master** (Excel) dengan format identik template, sehingga dapat
  diedit lalu di-import ulang (round-trip) — mendukung bulk update.
- **AC14:** Semua master menampilkan halaman **Import History** (file, user, waktu, hasil) dengan
  tautan ke file laporan hasil & rollback per batch (opsional, P2).

**Relasi Part → Material:**
- **AC10:** `Part.material_id` **merujuk** ke `Material` (bukan teks bebas), sehingga
  `PP BOROUGH BF970A1+PH6728 DIC (MB) BLACK` dan `TRPOM11 POM-1C NO.P-9801` menjadi record master.
- **AC11:** Label material pada form/PDF tetap ditampilkan **verbatim** seperti dokumen asli
  (menggabungkan `material_name` + `additive_masterbatch` + `color` sesuai pola yang dikonfigurasi).

---

### 5.3 FR-03 — Master Mesin (M/C)
| Field | Tipe | Catatan |
|---|---|---|
| `machine_no` | string | mis. `M/C No` pada CS-05 |
| `type` | enum | `INJECTION_HORIZONTAL`, `INJECTION_VERTICAL`, `PRESS`, `OTHER` |
| `tonnage` | integer | opsional |
| `plant` | ref Plant | — |
| `shift_profile` | ref `WorkSchedule` | menentukan slot waktu patrol yang aktif (lihat FR-03a AC1) |
| `is_active` | bool | — |

- **AC1:** CS-05 menampilkan tooltip/petunjuk `shot ke-6 (vertikal)` atau `shot ke-11 (horizontal)`
  otomatis berdasarkan `type` mesin.

---

### 5.3a FR-03a — Master Shift & Jadwal Kerja (**Modular**) ⭐⭐

> **Keputusan user:** *"cukup, karena akan ada 3 shift. Atau buatkan juga master data shift dan jadwal
> kerjanya. Buat modular juga jadi bisa digunakan oleh company dengan sistem 2 shift."*
>
> **Prinsip:** jumlah shift, durasi, jam mulai, dan hari kerja **BUKAN konstanta**.
> Semua dikelola sebagai master data sehingga satu instalasi yang sama dapat melayani company dengan
> **1 shift, 2 shift, 3 shift, atau non-stop** — hanya dengan konfigurasi.

#### A. `ShiftTemplate` — pola jumlah shift

| Field | Tipe | Wajib | Contoh |
|---|---|---|---|
| `code` | string, unik | ✔ | `S1`, `S2`, `S3`, `NS` |
| `name` | string | ✔ | `1 Shift (Non-stop Pagi)`, `2 Shift`, `3 Shift`, `Non-stop` |
| `shift_count` | integer | ✔ | `1`, `2`, `3` |
| `cycle_pattern` | string | ✖ | `1-1-1` / `1-2` / `1-2-3` — **label deskriptif saja** (shift tetap, tanpa rotasi) |
| `slot_duration_minutes` | integer | ✔ | `120` (selaras form Patrol 2-jam-an) |
| `total_hours_per_day` | integer | ✔ | `8`, `16`, `24` |
| `is_active` | bool | ✔ | — |

#### B. `Shift` — definisi tiap shift dalam template

| Field | Tipe | Contoh (3 shift) | Contoh (2 shift) |
|---|---|---|---|
| `template_id` | ref ShiftTemplate | — | — |
| `shift_no` | integer | `1, 2, 3` | `1, 2` |
| `name` | string | `Shift 1`, `Shift 2`, `Shift 3` | `Shift 1`, `Shift 2` |
| `start_time` | time | `06:00`, `14:00`, `22:00` | `07:00`, `19:00` |
| `end_time` | time | `14:00`, `22:00`, `06:00` (lintas hari) | `19:00`, `07:00` |
| `duration_minutes` | integer | `480` | `720` |
| `crosses_midnight` | boolean (derived) | shift 3 = `true` | shift 2 = `true` |
| `break_minutes` | integer | `60` | `60` |
| `is_night_shift` | boolean | shift 3 = `true` | shift 2 = `true` |

#### C. `WorkSchedule` — jadwal kerja per periode (kalender)

Mendukung pola **harian dan mingguan** (shift tetap per hari), plus hari libur.

| Field | Tipe | Contoh |
|---|---|---|
| `code` | string, unik | `WS-JAN26-KRW` |
| `name` | string | `Jadwal Januari 2026 — Karawang` |
| `plant_id` | ref Plant | `KRW` |
| `shift_template_id` | ref ShiftTemplate | `S3` |
| `effective_from` / `effective_to` | date | `2026-01-01` … `2026-01-31` |
| `work_days` | array | `[MON..SAT]` (shift tetap, tidak ada rotasi) |
| ~~`rotation_enabled`~~ | — | **Dihapus** — tidak ada rotasi pola |
| ~~`rotation_groups`~~ | — | **Dihapus** — tidak ada rotasi pola |
| `holidays` | JSON | `['2026-01-01', ...]` — slot tidak dihitung terlewat |
| `is_active` | bool | — |

#### D. `MachineSchedule` — penugasan jadwal ke mesin

| Field | Tipe | Keterangan |
|---|---|---|
| `machine_id` | ref Machine | — |
| `work_schedule_id` | ref WorkSchedule | — |
| `effective_from` / `effective_to` | date | memungkinkan pergantian jadwal |

#### E. Penurunan slot waktu Patrol (inti integrasi)

Slot pada CS-05 **dibangkitkan** dari `WorkSchedule` → `ShiftTemplate` → `Shift`:

```
Untuk tanggal D dan mesin M:
  schedules = MachineSchedule(M) yang aktif pada D
   untuk setiap Shift s yang berlaku pada D (sesuai work_days/holidays):
     slot = potong [s.start_time, s.end_time) per slot_duration_minutes
     hasil: ['06:00~08:00','08:00~10:00','10:00~12:00','12:00~14:00']  ← Shift 1 (3 shift)
```

**Contoh hasil generate:**

| Konfigurasi | Slot yang dihasilkan per hari |
|---|---|
| **3 shift** (06:00/14:00/22:00, slot 120 mnt) | 12 slot — sama persis dengan form asli ✔ |
| **2 shift** (07:00/19:00, slot 120 mnt) | 12 slot (`07:00~09:00` … `05:00~07:00`) |
| **1 shift** (08:00–16:00, slot 120 mnt) | 4 slot (`08:00~10:00` … `14:00~16:00`) |
| **Non-stop** (3 shift, `holidays` kosong) | 12 slot setiap hari, termasuk Sabtu/Minggu |

- **AC1:** Jumlah & label slot waktu CS-05 **sepenuhnya diturunkan** dari `WorkSchedule`, bukan konstanta.
  Konfigurasi 3 shift menghasilkan **12 slot identik** dengan form kertas asli (verifikasi T13).
- **AC2:** Mendukung **2 shift** tanpa perubahan kode — hanya data (dibuktikan test T24).
- **AC3:** Mendukung shift **lintas tengah malam** (`crosses_midnight`), mis. `22:00~24:00` + `24:00~02:00`.
- **AC4:** Shift bersifat **tetap** (tidak ada rotasi pola). Admin mengatur jadwal per periode, dan hari kerja/libur per `WorkSchedule`.
- **AC5:** `holidays` pada `WorkSchedule` membuat slot **tidak** dihitung terlewat dan reminder (FR-15) berhenti.
- **AC6:** Perubahan `Shift`/`WorkSchedule` hanya berlaku untuk checksheet **baru**; checksheet lama memakai
  **snapshot** slot (konsisten dengan prinsip immutability PRD §6 AC1).
- **AC7:** Validasi: total `duration_minutes` shift dalam template harus = `total_hours_per_day`;
  slot terakhir dipotong bila tidak habis dibagi `slot_duration_minutes`.
- **AC8:** Deteksi overlap antar shift → ditolak dengan pesan jelas.
- **AC9:** `grace_minutes` per shift untuk toleransi reminder (FR-15).
- **AC10:** Tersedia **preset bawaan** yang dapat diduplikasi: `3 Shift (06/14/22)`, `2 Shift (07/19)`,
  `1 Shift (08–16)`, `Non-stop` — memudahkan company baru memulai.
- **AC11:** Semua master shift & jadwal dapat di-**import dari Excel** (FR-02a engine, Q11) dan diekspor.
- **AC12:** Tersedia tampilan **kalender visual** jadwal kerja (per bulan, per grup), read-only untuk inspector.

---

### 5.4 FR-04 — Plant / Perusahaan (Multi-Plant + Branding)
Keputusan: **multi-plant dalam satu perusahaan**, tetapi form asli menampilkan **dua identitas perusahaan**
(PT. TOKAI RIKA SAFETY INDONESIA dan PT. PLASESS INDONESIA) dan lokasi `KARAWANG`.

| Field | Tipe | Catatan |
|---|---|---|
| `plant_code` | string | mis. `KRW` |
| `plant_name` | string | mis. `KARAWANG` |
**Field Plant:** `plant_code`, `plant_name` (mis. `KARAWANG`), `address`, `logo`, `timezone` (default `Asia/Jakarta`).

> **Perubahan (Q9/Q10):** field `company_left` / `company_right` **dihapus** dari Plant. Identitas perusahaan
> pada kop & blok tanda tangan sekarang berasal dari **Business Partner** (lihat FR-02 AC10–AC11) sehingga
> sepenuhnya modular dan dapat dipilih user.

- **AC1:** Semua data transaksi ter-scope ke plant. User hanya melihat plant yang diizinkan.
- **AC2:** Master Business Partner / Material / Part dapat ditandai *shared* lintas plant (read-only di plant lain).
- **AC3:** Blok tanda tangan PDF: sisi kanan = Partner ber-role `COMPANY` dengan `is_system_owner = true`;
  sisi kiri = Partner `SUPPLIER` terpilih pada checksheet (Q10).

---

### 5.5 FR-05 — Pengaturan Penomoran (Numbering Rules) ⭐
**Permintaan eksplisit user:** "buatkan settingan khusus untuk penomoran".

Dua jenis penomoran yang dikelola:

**A. Nomor dokumen transaksi** (mis. nomor checksheet yang dihasilkan sistem)

> **Keputusan user (Q5):** *"penomoran dokumen semua bisa dilakukan di setting untuk format-nya, dan
> untuk No-nya otomatis berurutan."* → **format 100% konfigurabel lewat Setting UI**, sedangkan **nomor
> urut dibangkitkan otomatis** oleh sistem (tidak pernah diketik manual).

| Field | Contoh | Keterangan |
|---|---|---|
| `rule_code` | `INCOMING_COLLAR` | unik per jenis form |
| `doc_type` | `CHECK_SHEET` \| `ISSUE` \| `SPEC` \| `PLAN` \| `TODO` \| `LOT` | berlaku untuk semua jenis dokumen |
| `format_pattern` | `{PREFIX}/{YYYY}{MM}/{PLANT}/{SEQ:4}` | disusun bebas oleh admin |
| `prefix` | `CS` | bagian dari format |
| `reset_period` | `YEARLY` \| `MONTHLY` \| `DAILY` \| `PER_SHIFT` \| `NEVER` | kapan `SEQ` kembali ke 1 |
| `padding` | `4` | jumlah digit, mis. `0001` |
| `start_from` | `1` | nomor awal |
| `next_value` | `1` | dikelola sistem (read-only untuk user) |
| `scope` | `PER_PLANT` \| `GLOBAL` | apakah counter dipisah per plant |
| `is_active` | `true` | — |

**Placeholder yang didukung:** `{PREFIX}` `{YYYY}` `{YY}` `{MM}` `{DD}` `{PLANT}` `{FORM_CODE}`
`{DOC_TYPE}` `{SUPPLIER_CODE}` `{PART_NO}` `{SEQ:n}`.

- **AC1:** Nomor dihasilkan **otomatis & berurutan** per `scope` + `reset_period`; dijamin **unik dan
  gap-free**, dibangkitkan atomik (aman untuk konkurensi / banyak inspector sekaligus).
- **AC2:** User **tidak dapat** mengetik nomor urut secara manual; hanya format yang diatur admin.
  (Override manual hanya untuk role `ADMIN` dengan alasan wajib & tercatat di audit trail.)
- **AC3:** Preview live di UI saat admin menyusun `format_pattern`, termasuk contoh hasil 3 nomor berikutnya.
- **AC4:** Validasi format: menolak placeholder tidak dikenal, menolak `{SEQ}` ganda, dan memberi
  peringatan bila hasil berpotensi duplikat.
- **AC5:** Perubahan rule **hanya berlaku untuk dokumen baru**; dokumen lama tidak berubah (immutable).
- **AC6:** Setting tersedia untuk **semua** jenis dokumen: Checksheet, Issue, Spec, Plan, Todo, Lot Number.
- **AC7:** Simulasi/reset counter dengan konfirmasi ganda + audit trail (mis. awal tahun buku baru).

**B. Normalisasi penomoran item template** (keputusan: dinormalisasi)

Karena user memilih *"Isi persis, penomoran dinormalisasi"*, aturan penomoran item dibuat **dapat
dikonfigurasi per template**, dengan **default: berurutan sesuai grup**:

| Template | Kondisi asli | Setelah normalisasi (default) |
|---|---|---|
| CS-02 INSERT | `1.1 PART NO`, `1.2 SURFACE TREATMENT`, `1. 3 OQC DATA` | `1.1`, `1.2`, `1.3` |
| CS-02 INSERT | grup Actual Parts mulai lagi `1.1`, `1.2`, `1.3` | `2.1`, `2.2`, `2.3` |
| CS-02 INSERT | grup Packing `2.1`, `2.2` | `3.1`, `3.2` |
| CS-05 PATROL | chara `①..⑲` dengan ⑯⑰ **duplikat** | `①..⑲` unik berurutan |
| CS-06 IDS | No `1..6` (sudah konsisten) | tidak berubah |
| CS-01, CS-03, CS-04 | sudah konsisten secara visual | tidak berubah |

Mode yang tersedia di template setting:
- `SEQUENTIAL_BY_GROUP` *(default)* — seperti tabel di atas.
- `KEEP_ORIGINAL` — replikasi teks asli apa adanya (untuk kebutuhan legal/audit).
- `CUSTOM` — admin mengetik label nomor per item.

> **Keputusan user (Q8):** *"Butuh"* → mode **`KEEP_ORIGINAL` wajib tersedia** dan menjadi fitur
> **P0**, bukan opsional. Tujuannya agar dokumen dapat direplikasi identik dengan aslinya untuk
> keperluan audit legal. Lihat AC6–AC9.

- **AC1:** Setiap template menyimpan `numbering_mode` + `numbering_overrides` (JSON per item).
- **AC2:** Daftar perubahan tersimpan di halaman **Revisi & Doc Control** dan tercetak pada changelog.
- **AC3:** Perubahan mode menaikkan **versi minor template** dan mewajibkan `effective_date`.
- **AC4:** ⭐ **`KEEP_ORIGINAL` mereplikasi teks asli secara eksak**, termasuk
  `"1. 3 OQC DATA"`, `"1. 3 SEET DATA SUPPLIER"`, dan label duplikat `⑯` `⑰` pada CS-05.
  Nilai label disimpan apa adanya sebagai string uncode, **tidak** dinormalisasi otomatis.
- **AC5:** Mode dapat dipilih **per template** (bukan global), sehingga CS-02/CS-05 dapat memakai
  `KEEP_ORIGINAL` sementara template baru memakai default `SEQUENTIAL_BY_GROUP`.
- **AC6:** Ketika `KEEP_ORIGINAL` aktif, UI **menampilkan badge peringatan**: "Penomoran asli (tidak
  dinormalisasi) — terdapat duplikasi/lompatan nomor sesuai dokumen sumber", beserta tautan ke daftar.
- **AC7:** Bila ada duplikat label (⑯⑰), sistem menyimpan `display_label` (asli) **dan** `sequence_key`
  (internal unik) secara terpisah, sehingga navigasi & validasi tetap berfungsi tanpa mengubah tampilan.
- **AC8:** Mode dapat diubah kapan saja oleh admin; **dokumen yang sudah dibuat tidak berubah**
  karena menggunakan snapshot template.
- **AC9:** Export PDF pada mode `KEEP_ORIGINAL` menghasilkan label **byte-identik** dengan dokumen sumber;
  diverifikasi pada UAT (T15).

---

### 5.6 FR-06 — Template Checksheet (Engine Inti) ⭐⭐

**Model konseptual:**
```
Template (1) ── (N) Section ── (N) Item ── (N) ValueColumn
                                             └─ Standard / Tolerance / Tool / Freq
Template (1) ── (N) HeaderField   (kiri: PART NO, PART NAME, ETA DATE, ...)
Template (1) ── (N) SignatureSlot (Approved, Checked, Inspector, Staff, ...)
Template (1) ── (N) Attachment    (Sketch/Picture)
```

**Tipe layout (`layout_mode`)** — diturunkan dari analisa:

| Mode | Dipakai | Deskripsi |
|---|---|---|
| `FLAT_TABLE` | CS-01, CS-02, CS-03, CS-04 | 1 baris = 1 item check; Actual[1..n] |
| `MATRIX_TIME` | CS-05 | Baris = slot waktu (dibangkitkan dari `WorkSchedule` — FR-03a) + First/Last Shot; Kolom = chara ①..⑲ |
| `MATRIX_CAVITY` | CS-06 | Baris = item; Kolom = cavity 1..8 (jumlah dari master part) |

> **Keputusan user (Q4):** *"buatkan saja untuk jaga-jaga"* → engine dirancang **generik & extensible**
> sejak Fase 1 sehingga checksheet ke-7 dan seterusnya dapat dibuat **tanpa menulis kode baru**.
> Konsekuensi konkret (lihat AC8–AC14 di bawah).

**Kapabilitas generik yang wajib ada di Fase 1 (persiapan form baru):**

| Kapabilitas | Penjelasan | Contoh kebutuhan |
|---|---|---|
| `layout_mode` extensible | Mode baru dapat ditambahkan sebagai *plugin renderer*; 3 mode awal cukup untuk semua form saat ini | Form baru dengan matriks 2 dimensi berbeda |
| **Header field builder** | Admin mendefinisikan sendiri field header (label, tipe, wajib/opsional, sumber: master atau manual) | CS-01 punya `KEDATANGAN DATE`; CS-04 punya `TO CHECKED PACKING NO.` |
| **Column set builder** | Susunan kolom tabel didefinisikan per template (bukan hardcode) | CS-04 memakai `LIMIT`/`TOOL`/`RESULT`, CS-06 memakai `Range`/`Freq`/`Cavity` |
| **Section & sub-item** | Grup item bertingkat (maks. 3 level) | CS-03 `4.2 Kondisi bag` → 3 sub |
| **Mixed input type per item** | Satu template boleh mencampur `NUMBER`, `TEXT`, `JUDGEMENT`, `SELECT`, `DATE`, `FILE` | CS-04 item 4 butuh berat (Kgs) |
| **Row generator** | Jumlah baris dinamis dari setting/master (slot waktu, cavity, jumlah sampel, measurement count) | CS-04 `value_count=3`, CS-06 cavity=8 |
| **Judgment rule** | `RANGE` \| `SELECT_OK_NG` \| `TEXT_MATCH` \| `MANUAL` \| `FORMULA` (Fase 2) | — |
| **Signature slot builder** | Jumlah & nama kolom TTD per template, termasuk 2 blok perusahaan | CS-05/CS-06 dua blok, CS-03 tiga kolom |
| **Attachment slot** | Jumlah slot gambar/lampiran per template | CS-01 sketch, CS-04 Mill Sheet |
| **Wording override** | Teks instruksi/keterangan/footer dapat diedit admin | "Kolom Actual please write base on actual result" |
| **Template clone & versioning** | Menyalin template lama → edit → rilis versi baru | Membuat form untuk part baru |

- **AC8:** Admin dapat membuat checksheet baru **100% dari UI Template Builder** tanpa deploy/kode.
- **AC9:** Template Builder memvalidasi kelengkapan sebelum bisa diaktifkan (minimal 1 section, 1 item,
  1 signature slot, doc_no, effective_date).
- **AC10:** Tersedia **3 template contoh minimal** yang sudah teruji untuk tiap `layout_mode`, dipakai
  sebagai titik awal membuat form baru.
- **AC11:** Menambah `layout_mode` baru = menambah 1 komponen renderer + 1 renderer PDF; perubahan
  **terisolasi** (tidak menyentuh mode lain). Diuji oleh 1 regression test per mode.
- **AC12:** Semua konfigurasi template disimpan sebagai **data (JSON terstruktur)**, bukan kode —
  memungkinkan export/import template antar environment.
- **AC13:** Field header yang tidak dipakai dapat disembunyikan tanpa menghapus definisi (non-breaking).
- **AC14:** Dokumen "Panduan Membuat Checksheet Baru" disertakan sebagai deliverable Fase 1.

**Field per Item:**

| Field | Tipe | Wajib | Catatan |
|---|---|---|---|
| `section` | ref Section | ✔ | mis. `1. Dokumen`, `2. Actual Parts`, `3. Packing Condition` |
| `label_no` | string | ✖ | hasil normalisasi; `null` = tanpa nomor |
| `detail_check` | string (i18n) | ✔ | mis. `1.1 Diameter Luar`, `Hole Diameter` |
| `standard_text` | string (i18n) | ✖ | mis. `Range 16.75 – 16.80`, `Tidak Dented, Tidak Deform` |
| `standard_value` | decimal | ✖ | mis. `20`, `3.2`, `0.15`; **boleh `null`** bila admin memutuskan standard diisi manual oleh checker |
| `tol_plus` / `tol_minus` | decimal | ✖ | mis. `+0.2`, `−0.2`, `+0.11`, `−0.1` |
| `range_min` / `range_max` | decimal | ✖ | dihitung/diisi: `2.8 – 3.01`, `0.13 ~ 0.17` |
| `standard_source` | enum | ✔ | `TEMPLATE` (default) \| `MANUAL_INPUT` — lihat FR-06 AC7 |
| `tool` | enum/string | ✖ | `Caliper`, `Micrometer`, `Visual`, `Scale`, `Vernier Caliper`, `Eye`, `Refer to Label` |
| `freq` | string | ✖ | mis. `F.L` (First & Last) |
| `area` | string | ✖ | mis. `PLI`, `TRSI`, `a`,`b`,`c`,`d` |
| `value_count` | integer | ✔ | default 1 (`n` = jumlah nilai per item) |
| `input_type` | enum | ✔ | `NUMBER` \| `TEXT` \| `JUDGEMENT` \| `SELECT` |
| `judgement_auto` | boolean | ✖ | `true` = OK/NG dihitung dari range |
| `is_required` | boolean | ✔ | default `true` |
| `allow_na` | boolean | ✔ | default `false`; `true` = boleh N/A + alasan |
| `sub_check` | string | ✖ | sub-baris (mis. `- Tidak basah`, `- Jahitan bag tidak lepas`, `- Tidak bolong`) |
| `sketch_ref` | ref Attachment | ✖ | gambar dimensi |

**AC:**
- AC1: Mengubah template **tidak** mengubah checksheet yang sudah submitted (snapshot imutabel).
- AC2: Template mendukung `value_count > 1` — CS-04 item 2 & 3 = 3 nilai; CS-06 = 8 cavity.
- AC3: Template mendukung `sub_check` bersarang (CS-03 item 4.2 punya 3 sub-kondisi).
- AC4: Item Bank memungkinkan item dipakai ulang antar template (mis. `Kebersihan Box`, `Kondisi Box`).
- AC5: Bilingual: setiap label punya `id` & `en`; fallback ke `id`.
- AC6: Template dapat di-*duplicate* untuk varian part baru (menghindari copy-paste antar file).
- AC7: **Standard / Tolerance boleh dikosongkan di template** (`standard_source = MANUAL_INPUT`).
  Dalam kondisi ini field `Standard` & `Tolerance/Range` pada form menjadi **input manual oleh
  Checker/Inspector**, wajib diisi sebelum submit, dan nilainya di-snapshot bersama hasil pengukuran.
  Judgment otomatis hanya berjalan bila range terisi (dari template **atau** dari input manual).

---

### 5.7 FR-07 — Checksheet: Incoming (CS-01 s.d. CS-04)

**Header field yang harus ada (dari form):**

| Form | Field Header |
|---|---|
| CS-01 COLLAR | KEDATANGAN DATE, LOT NUMBER, P/O NO, SAMPLING QTY (`1 pcs/Lot`), TOTAL QTY |
| CS-02 INSERT | INSPECTION DATE, LOT NUMBER, ETA DATE, P/O NO, SAMPLING QTY, TOTAL QTY |
| CS-03 PA 1300G | (PART NO / PART NAME di header) + Lot No., Delivery Note, Sertifikat via Email |
| CS-04 PRESS | LOT NO., TO CHECKED PACKING NO., GROUP OR PACKING NO., APPROVED, CHECKED, ISSUED |

**Struktur CS-01 (COLLAR) — 7 item:**
1. Dokumen → `1.1 PART NO` = `7145-0040-0w`; sub: `- Delivery`, `Note`, `- Seet Data Supplier`;
   `1.2 SEET DATA SUPPLIER` = `Terlampir`
2. Actual Parts → `2.1 Diameter Luar` (Caliper, range `16.75–16.80`);
   `2.2 Diameter Dalam` (Caliper, range `7.20–7.25`);
   `2.3 Appearance` *(Check 1pcs/Box)* = `Tidak salah part, Tidak Dented, Tidak Deform`
3. Packing Kondisi → `3.1 Kebersihan Box` = `Tidak Dirty`; `3.2 Kondisi Box` = `Tidak Basah, Tidak Rusak`
- Sketch: gambar + anotasi `⌀ 16,75` dan `⌀ 7,23`
- Final Judgment: OK / NG

**Struktur CS-02 (INSERT) — 8 item:**
1. Dokumen → `1.1 PART NO` = `730409-5310`; `1.2 SURFACE TREATMENT` = `Yellow with Backing`;
   `1.3 OQC DATA` = `Attached`
2. Actual Parts → `2.1 Hole Diameter` = `20 ±0.2`; `2.2 Thickness Mtrl` = `3.2 ±0.1`;
   `2.3 Appearance` = `No Dented, No Deform`
3. Packing Condition → `3.1 Kebersihan Box` = `No Dirty`; `3.2 Kondisi Box` = `No Wet, No Broken`
- Final Judgment: OK / NG

**Struktur CS-03 (PA 1300G) — 10 item:**
1. Dokumen → `1.1 Nama Material`, `1.2 Lot No.`, `1.3 Kode Warna`, `1.4 Grade`, `1.5 Delivery Note`
   (standard: "Semua dokumen harus sama dengan aktual material" / "Sesuai aktual material")
2. Sertifikat (Mill Sheet/CoA) → `2.1 Sertifikat` = `Jika Diperlukan`; `2.2 Grade` = `Sesuai aktual material`
3. Dokumen SoC → `3.1 Dokumen SoC` *(khusus new material)* = `Ada` / `Refer to database SOC`
4. Kondisi Packing → `4.1 Kebersihan bag` = `Tidak kotor`;
   `4.2 Kondisi bag` = 3 sub: `- Tidak basah`, `- Jahitan bag tidak lepas`, `- Tidak bolong`
- Final Judgement: OK / NG; TTD `KARAWANG,` + Approved by / Checked by / Issued by

**Struktur CS-04 (PRESS coil) — 5 item, kolom berbeda:**
`INSPECTION POINT NO | DESCRIPTION | CONTROL ITEM OR SPEC | LIMIT | TOOL | RESULT | JUDGMENT | REMARK`
1. `MATERIAL NAME` — `C1720-XHMB AU` / `Au 1-Side SP2` — Tool `REFER TO LABEL`
2. `t = 0.15 ± 0.02` — Limit `0.13 ~ 0.17` — MICROMETER — **RESULT 3 baris (1./2./3.)**
3. `W = 27 ± 0.20` — Limit `26.80 ~ 27.20` — VERNIER CALIPER — **RESULT 3 baris**
4. `MATERIAL TYPE` — `COIL` — VISUAL — `IDENTIFY RECEIVED WEIGHT … Kgs.`
5. `APPEARANCE` — `NO RUSTY, DENTED, SCRATCH` — VISUAL (EYE)

**AC:**
- AC1: Nilai `Actual` **selalu kosong** pada checksheet baru (bug master di CS-01 & CS-03 diperbaiki;
  nilai contoh dipindah ke `example_value` yang hanya tampil sebagai placeholder abu-abu).
- AC2: Field bertanda wajib menolak submit bila kosong; pesan validasi menyebut nomor item.
- AC3: Item numerik dengan range → `judgement_auto`; di luar range ⇒ NG + highlight merah.
- AC4: `Final Judgment` = NG bila **minimal satu** item NG (dapat di-override oleh Checked dengan alasan wajib).
- AC5: Dapat melampirkan dokumen (Delivery Note, Mill Sheet/CoA, OQC Data, SoC) sebagai file.

---

### 5.8 FR-08 — Checksheet: Patrol (CS-05)

**Header:** Part Name `A PILLAR PROTECTOR BASE` · Part No `7176-2680-30` · Model `468B` ·
Cavity `1` · Material `PP BOROUGH BF970A1+PH6728 DIC (MB) BLACK` · M/C No · Date · Customer `PASI`.

**Grid:**
- **Baris (12 slot + 2 spesial):** `06:00~08:00`, `08:00~10:00`, `10:00~12:00`, `12:00~14:00`,
  `14:00~16:00`, `16:00~18:00`, `18:00~20:00`, `20:00~22:00`, `22:00~24:00`, `24:00~02:00`,
  `02:00~04:00`, `04:00~06:00`; plus `First Shot` (Start / R/S / fraction) dan
  `Last Shot` (Finish / fraction).
- **Kolom:** 19 chara (setelah normalisasi ①..⑲ unik) dalam 3 grup:

| Grup | Chara | Isi (verbatim, dipertahankan) |
|---|---|---|
| M/C Condition | ① | Master condition sesuai dengan actual di MC monitor |
| | ② | Supervisi sesuai dengan range <Supervisi ON, Temp barel ±5°C, mold temp +5/−10°C> |
| | ③ | Material sesuai dengan MSC, dan sesuai dengan part yang masspro |
| | ④ | LIFE DIES RECORD, tidak melebihi std OH |
| | ⑤ | Primary ON, std sesuai dengan Mcond. Ketelitian 0.1 |
| APPEARANCE STANDARD | ⑥ | Opening permit IN L,M protection Harus OFF |
| | ⑦ | Point Check NG (Refer to sample & QCP), hati-hati part yang pernah claim customer |
| | ⑧ | Tidak Burr diarea penting (Parting Line, Lock, other), BURRY 0,5 MAX internal judgment |
| | ⑨ | Tidak short shot di area penting dan last fill material |
| | ⑩ | Operator melakukan pengecekan sesuai QCP |
| | ⑪ | WI / WS pokayoke dijalankan |
| | ⑫ | Operator melakukan pekerjaan dengan 1 cycle |
| | ⑬ | NG part dibuang di box merah, tidak terjadi mixing dengan OK part |
| | ⑭ | Pemastian 2S area meja operator tidak terdapat part, label yang berbeda |
| | ⑮ | CHECK DATE MARK DAN DI CETAK |
| PACKAGING | ⑯ | Sesuaikan part dan label <Tidak terjadi salah label, salah warna label> |
| | ⑰ | Inner Label tidak salah, pokayoke inners dijalankan |
| | ⑱ | Pokayoke packing sesuai WI (Hati-hati part similar) |
| | ⑲ | Penggunaan JIG QTY sesuai dengan WI |
| PIC PATROL | — | nama petugas (per baris waktu) |
| REMARK | — | \*Jika muncul chokotei, tuliskan Tipe, Waktu dan Hasil Judgement visual shot ke 6 untuk shot vertikal atau shot ke 11 untuk mesin horizontal |

**AC:**
- AC1: Setiap sel = `OK` / `NG` / `N/A` + catatan; baris waktu hanya aktif sesuai jam operasi mesin.
- AC2: Jika ada sel `NG`, sistem **wajibkan** mengisi `REMARK` (Tipe chokotei, Waktu, Hasil judgment).
- AC3: Petunjuk "shot ke-6 (vertikal) / ke-11 (horizontal)" muncul otomatis dari `machine.type`.
- AC4: Reminder notifikasi bila slot waktu terlewat (mis. jam 10:15 belum ada isian 08:00~10:00).
- AC5: `First Shot` & `Last Shot` field: `Start`, `R/S`, `fraction`, `Finish` (free text/time).

---

### 5.9 FR-09 — Checksheet: IDS (CS-06)

**Header:** Mold Code `TRSI-0041` · Customer `TRSI` · Model `D13PF` · Cav `8` · Doc `CS-PR-02-ENG-28/01` ·
Part No `7L0990-0280` · Part Name `SLIDER, PT` · Drawing Rev `10` ·
Material `TRPOM11 POM-1C NO.P-9801` · Color `NATURAL` · Proses Insp `INJECTION PROSES` ·
Lot No · Inspection Date · Start/Finish Insp · Inspector · Page `1/1` · Inspection Time.

**Kolom:** `No | Item check | Dimension | Tolerance (+/−) | Range | Freq. | Meas. Tool | Area | CAVITY 1..8 | Judge | Remark`

| No | Item | Dimension | Tol + | Tol − | Range | Freq | Tool | Area |
|---|---|---|---|---|---|---|---|---|
| 1 | Distance | `2.9` | `0.11` | `0.1` | `2.8 – 3.01` | F.L | X | PLI, TRSI |
| 2 | Distance | `9.3` | `0.1` | `0.11` | `9.19 – 9.4` | F.L | X | a,b,c,d × (PLI, TRSI) |
| 3 | Appearance | No burr / Flash / Sink Mark and Warps | — | — | — | F.L | Visual | PLI, TRSI |
| 4 | Material | `TRPOM11 POM-1C NO.P-9801` | — | — | — | F.L | Visual | PLI, TRSI |
| 5 | Color | `Natural` | — | — | — | F.L | Visual | PLI, TRSI |
| 6 | Weight | `1.45` | `0.04` | `0.04` | `1.41 – 1.49` | F.L | Scale | PLI, TRSI |

**AC:**
- AC1: Jumlah kolom CAVITY mengikuti `part.default_cavity_count` (default `8`); dapat diubah saat create.
- AC2: Item `Distance 9.3` punya **8 baris** (a,b,c,d × PLI,TRSI) — direpresentasikan sebagai item dengan
  `area` berulang, bukan item berbeda.
- AC3: Judge dihitung otomatis per cavity dari range (semua dalam range ⇒ OK).
- AC4: ⚠️ **Keputusan user (Q1):** nilai `WEIGHT 1.45 ±0.04` pada IDS (part SLIDER) **disamakan dengan
  dokumen asli** (tetap diisi `1.45`, `+0.04`, `−0.04`, range `1.41 – 1.49`), **atau dikosongkan**
  agar diisi manual oleh checker — dipilih per item lewat `standard_source` (FR-06 AC7).
  Default seed: **diisi sama dengan dokumen**, ditandai `needs_verification = true` dan muncul di
  checklist validasi template agar QA dapat mengubahnya kapan saja tanpa deploy ulang.

---

### 5.10 FR-10 — Validasi & Judgment Otomatis

| Aturan | Detail |
|---|---|
| `NUMBER` + range | `min ≤ value ≤ max` ⇒ OK; selain itu NG |
| `NUMBER` tanpa range | wajib ada nilai; judgment manual |
| `TEXT` | wajib terisi; judgment manual (`JUDGEMENT` type ⇒ OK/NG) |
| `is_required` | submit ditolak jika kosong (kecuali `allow_na` + alasan ≥ 10 karakter) |
| Multi-nilai | NG total bila **salah satu** nilai NG; detail per nilai disimpan |
| Final Judgment | NG bila ≥1 item NG; override butuh alasan & role minimal `CHECKED` |

- **AC1:** Pesan error menampilkan `section + nomor item + nama field`, siap dipakai inspector.
- **AC2:** Validasi berjalan dua lapis: client (instan) & server (otoritatif).
- **AC3:** Semua perhitungan deterministik dan disnapshot saat submit (hasil tidak berubah bila template diubah).

---

### 5.11 FR-11 — Alur Approval (Inspector → Checked → Approved)

**State machine:**
```
DRAFT ──submit──▶ SUBMITTED ──checked──▶ CHECKED ──approve──▶ APPROVED ──▶ (ARCHIVED / EXPORTED)
  ▲                   │                     │
  │                   │                     │
  └──── reject ◀──────┘                     └── reject ──▶ kembali ke SUBMITTED / DRAFT
```

| Transisi | Role | Syarat |
|---|---|---|
| `DRAFT → SUBMITTED` | `INSPECTOR` (pemilik) | Semua field wajib terisi |
| `SUBMITTED → CHECKED` | `CHECKED` atau lebih tinggi | Tidak boleh orang yang sama (segregation of duties) |
| `CHECKED → APPROVED` | `APPROVED` (`QC Manager`) | Tidak boleh sama dengan Checked |
| `* → DRAFT` (reject) | Checked/Approved | **wajib alasan**; tercatat di audit trail |

**AC:**
- AC1: Setiap transisi mencatat `user_id`, `role`, `timestamp`, `ip`, `reason`, dan **snapshot** data.
- AC2: Setelah `APPROVED`, checksheet **immutable**; koreksi harus lewat **revisi** (`REVISION` baru,
  tertaut ke dokumen asal, dengan alasan).
- AC3: Tanda tangan digital = `user login + nama + timestamp`, dicetak pada slot PDF.
- AC4: Notifikasi in-app + email ke approver saat ada item di queue.
- AC5: Approval Queue menampilkan aging (berapa lama menunggu).

---

### 5.12 FR-12 — Export PDF & Excel 1:1 ⭐

- **PDF 1:1:** header identitas perusahaan, blok header part, tabel item (merged cell, lebar kolom &
  tinggi baris menyerupai asli), blok Sketch/Picture, Final Judgment, blok tanda tangan, footer
  `Doc. No` + `Effective Date` + `Revisi History`.
- **Excel .xlsx:** struktur kolom & merge cell sama; berguna untuk yang masih butuh Excel.
- **AC1:** Verifikasi **item-per-item** terhadap dokumen asli (checklist QC, lihat §13 T2).
- **AC2:** Wording, angka, simbol (`±`, `~`, `–`, ⌀, ①..⑲) ter-render benar.
- **AC3:** Nama file: `{FORM_CODE}_{PART_NO}_{LOT}_{YYYYMMDD}_{SEQ}` (mengikuti aturan penomoran §5.5).
- **AC4:** Ekspor massal (batch) untuk satu periode, dibundel ZIP.
- **AC5:** PDF dilindungi watermark `DRAFT` selama belum APPROVED.

---

### 5.13 FR-13 — Laporan & Pencarian

| Laporan | Isi | Filter |
|---|---|---|
| Riwayat per Lot | Semua checksheet untuk 1 lot / lot number | part, supplier, tanggal |
| Rekap Harian Inspection | Jumlah cek, OK, NG, rasio NG% | plant, tanggal, jenis form |
| Patrol Compliance | Slot waktu terisi vs terlewat per mesin | mesin, shift, tanggal |
| NG Analysis | Item check paling sering NG (top N) | periode, part |
| Aging Approval | Dokumen menunggu Checked/Approved | role, umur hari |
| Traceability Part | Semua lot sebuah part + hasil akhir | part_no |

- **AC1:** Semua laporan dapat diekspor (PDF/Excel/CSV) sesuai izin role.
- **AC2:** Viewer/Auditor mendapat akses read-only penuh untuk keperluan audit.
- **AC3:** Pencarian global: `part_no`, `lot_no`, `doc_no`, `form_name` — hasil < 1 detik.

---

### 5.14 FR-14 — Audit Trail
- Mencatat: login, CRUD master data, perubahan template/revisi, submit, approve/reject, export, hapus/soft-delete.
- **AC1:** Immutable, append-only; tidak dapat dihapus oleh siapa pun termasuk `ADMIN`.
- **AC2:** Dapat difilter per user, entitas, dan rentang tanggal; dapat diekspor.

---

### 5.15 FR-15 — Notifikasi & Reminder
- Reminder isi patrol per slot waktu (dapat diatur menit toleransi).
- Notifikasi approval masuk / dokumen dikembalikan.
- Alert template `needs_verification` (lihat FR-09 AC4).
- Kanal Fase 1: in-app + email. (WhatsApp/Telegram = Fase 2.)

---

### 5.16 FR-16 — Revisi & Doc Control
- Setiap template punya `doc_no`, `effective_date`, `revision_no`, `revision_history`
  (`Mark | Content | Pic | Date`) — meniru blok revisi CS-05.
- **AC1:** Revisi baru = versi baru; dokumen lama tetap tertaut versi lama.
- **AC2:** Menampilkan **changelog** normalisasi penomoran (CS-02, CS-05) secara transparan.

---

### 5.17 FR-17 — Usability & Operasional Harian

Ditambahkan dari review PRD v1.1 (celah yang ditemukan saat review).

**a) Autosave draft**
- Draft tersimpan otomatis tiap **10 detik** (atau on-blur) tanpa menekan tombol simpan.
- Indikator status: `Menyimpan… / Tersimpan 10:42 / Gagal menyimpan`.
- **AC1:** Perubahan yang belum tersimpan diberi peringatan saat meninggalkan halaman.
- **AC2:** Tidak ada kehilangan data bila koneksi putus; draft dapat dilanjutkan perangkat lain.

**b) Duplikasi checksheet**
- "Copy dari checksheet sebelumnya" untuk lot/part/mesin yang sama (mis. patrol shift berikutnya).
- **AC1:** Yang disalin hanya **header + struktur**, **bukan** nilai Actual & judgment.
- **AC2:** Tetap membuat nomor baru dari Numbering Rule; tidak menimpa dokumen asal.

**c) Validasi Lot Number**
- **AC1:** `lot_no` wajib format sesuai pola bila dikonfigurasi di Setting (mis. `[A-Z0-9-]{4,32}`).
- **AC2:** Peringatan (bukan blokir) bila `lot_no` + `part_no` + `supplier` sudah pernah dipakai,
  dengan tautan ke checksheet sebelumnya (mencegah duplikasi input).
- **AC3:** Pencarian lot bersifat case-insensitive & trim spasi.

**d) Delegasi saat cuti / izin**
- Approver (`CHECKED`/`APPROVED`) dapat menunjuk pengganti untuk rentang tanggal tertentu.
- **AC1:** Delegasi tercatat di audit trail (siapa mendelegasikan ke siapa, periode, alasan).
- **AC2:** Segregation of duties tetap berlaku — delegasi tidak boleh membuat orang yang sama
  menjadi Checked **dan** Approved pada dokumen yang sama.
- **AC3:** Delegasi berakhir otomatis pada `end_date`.

**e) Import/Export master data (CSV/Excel)**
- **AC1:** Import Part / Supplier / Customer / Mesin via template CSV dengan preview & validasi baris.
- **AC2:** Mode `create-only` dan `upsert`; baris gagal dilaporkan per baris beserta alasannya.
- **AC3:** Semua import tercatat di audit trail (file, jumlah baris, user, waktu).
- **AC4:** Export master data untuk backup/manual review.

**f) Kalender hari libur / non-produksi**
- **AC1:** Kalender hari libur per plant; slot patrol pada hari libur **tidak dihitung terlewat**.
- **AC2:** Reminder patrol (FR-15) mengikuti kalender ini.

---

## 6. Model Data (Ringkas)

```
Plant ─┬─ User ── UserRole (role, plant)
       ├─ Machine ── WorkSchedule ── ShiftTemplate ── Shift
       ├─ BusinessPartner ── BusinessPartnerRole (COMPANY | SUPPLIER | CUSTOMER)  ← modular (Q9)
       ├─ Material ── partner_ref (Supplier)
       ├─ Part ──────────┬─ material_id → Material
       │                 ├─ default_partner (supplier/customer)
       │                 ├─ (default_cavity_count, mold_code)
       │                 └─ Checksheet ── ChecksheetResult ── CellValue[]
       ├─ Template ── TemplateVersion ── Section ── Item ── ValueColumn[]
       │                                    └─ Attachment (sketch)
       ├─ NumberingRule (doc_type, format_pattern, reset_period, next_value, scope)
       └─ Settings (key/value per plant: shift, numbering, retensi, reminder, numbering_mode)

Checksheet: id, number (dari NumberingRule), template_version_id (snapshot),
            part_id, plant_id,
            company_partner_id (penerima/owner), supplier_partner_id, customer_partner_id,
            machine_id(s), shift_profile_snapshot, lot_no, po_no,
            inspection_date, eta_date, sampling_qty, total_qty, status, final_judgment,
            inspector_id/checked_id/approved_id + timestamp masing-masing,
            rejection_reason, retention_until, archived_at,
            created_at, updated_at, form_data (JSONB snapshot)

ChecksheetResult: checksheet_id, item_id, display_label (KEEP_ORIGINAL), sequence_key,
                  row_key (slot waktu '08:00~10:00' | cavity '3' | null),
                  value_index (1..n), actual_value, judgment, remark, na_reason,
                  standard_snapshot, tolerance_snapshot   ← untuk item ber-`MANUAL_INPUT`

Approval: checksheet_id, level (CHECKED|APPROVED), user_id, action, reason, at, ip
Attachment: entity_type, entity_id, kind (SKETCH|DELIVERY_NOTE|MILL_SHEET|OQC|SOC|PHOTO), file
ImportJob: entity (PARTNER|MATERIAL|PART|MACHINE|PLANT|USER), file, mode, total/ok/warn/failed, user, at
AuditLog: append-only
```

- **AC1:** `Checksheet.form_data` menyimpan snapshot template saat submit ⇒ hasil tidak berubah
  meski template direvisi kemudian.
- **AC2:** Soft-delete untuk semua master data; hard-delete dilarang untuk data transaksi.
- **AC3:** Indeks pada `part_no`, `lot_no`, `number`, `inspection_date`, `status`.

---

## 7. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| **Performa** | Halaman list < 1 s (p95); simpan draft < 500 ms; generate PDF < 5 s |
| **Kapasitas** | Rencana awal: 50 user aktif, ~200 checksheet/hari |
| **Retensi** | **10 tahun** (dikonfirmasi Q7), dapat diubah di Setting. Audit log & checksheet `APPROVED` **tidak pernah dihapus otomatis**; setelah periode retensi berpindah ke status `ARCHIVED` (read-only, tetap dapat dicari & diekspor) |
| **Ketersediaan** | 99,5% pada jam operasi (24/7 shift 3) |
| **Keamanan** | RBAC, session expiry, password policy, HTTPS wajib, dokumen via signed URL |
| **Auditabilitas** | Immutable audit log; checksheet approved tidak dapat diubah |
| **Bahasa** | Bilingual ID/EN (i18n), istilah form asli dipertahankan |
| **Perangkat** | Web responsif; ramah tablet (input di lantai produksi), target layar ≥ 1024px untuk edit |
| **Compatibility** | Chrome/Edge versi 2 tahun terakhir; layout cetak difokuskan A4 landscape |
| **Backup** | Harian, retensi 30 hari, uji restore bulanan |
| **Aksesibilitas** | Kontras cukup untuk area produksi (pencahayaan terang); target tap ≥ 44px |

---

## 8. Arsitektur Teknologi

| Layer | Pilihan |
|---|---|
| Framework | **Next.js (App Router) + TypeScript** |
| UI | Tailwind CSS + component library (shadcn/ui) + i18n (next-intl) |
| ORM | Prisma atau Drizzle (diputuskan di Spec) |
| Database | **PostgreSQL** |
| Auth | Auth.js / session cookie + RBAC guard server-side |
| PDF | Render HTML→PDF (Playwright/Puppeteer) atau Excel→PDF untuk kesetiaan layout |
| Excel | `exceljs` (pertahankan merge/lebar kolom) |
| Storage | S3-compatible / MinIO untuk sketch & lampiran |
| Deploy | Docker Compose on-premise (target awal) |
| Queue | BullMQ/Redis untuk generate PDF & reminder patrol |

**Prinsip:** *template-driven* — menambah checksheet baru adalah **konfigurasi**, bukan kode baru.

---

## 9. Kebutuhan Data Awal (Seed)

Disepakati: **seed 6 template + master data dari file**.

| Entitas | Seed |
|---|---|
| Plant | `KARAWANG` (PLASESS + TRSI) |
| **BusinessPartner** (modular — Q9) | `PLASESS` = `PT. PLASESS INDONESIA` → roles `[COMPANY]`, `is_system_owner = true`, side `RIGHT` · `PASI` = `PT. PASI` → roles `[SUPPLIER, CUSTOMER]`, `supplier_type = PART` · `TRSI` → roles `[SUPPLIER, CUSTOMER]` (Q6: supplier) · `KMPI` = `PT. KMPI` → `[SUPPLIER]`, `MATERIAL` · `YHT` = `PT. Yahata Fastener Indonesia` → `[SUPPLIER]`, `PART` · `TOKAI_RIKA` = `PT. TOKAI RIKA SAFETY INDONESIA` → `[SUPPLIER]` (Q10, tampil sebagai pilihan supplier) |
| **Material** | `PA1300G` / `PA 1300G` (grade `1300G`), `C1720-XHMB-AU` (`C1720-XHMB AU`, size `0.15 x 27 x COIL`), `TRPOM11-POM1C` (`TRPOM11 POM-1C NO.P-9801`, color `NATURAL`), `PP-BOROUGH-BF970A1` (`PP BOROUGH BF970A1` + MB `PH6728 DIC (MB)`, color `BLACK`) — masing-masing dengan `partner_ref` |
| Part | `7145-0040-0w` (COLLAR), `730409-5310` (Anchor Through), `7176-2680-30` (A PILLAR PROTECTOR BASE, model 468B), `7L0990-0280` (SLIDER PT, mould TRSI-0041, cav 8) — masing-masing dengan `material_id` + `default_partner` |
| Template | 6 template lengkap dengan section, item, standard, toleransi, tool, freq, area, sketch |
| Doc No & Effective | CS-PR-05-QAD-01D/00 (01-08-2025), CS-PR-05-QAD-01A/04 (15-11-2016), CS-PR-05-QAD-01A/06 (02.01.2026), CS-PR-05-QAD-01B/00 (23-12-2022), CS-PR-07-QAD-237/02 (20-03-2023), CS-PR-02-ENG-28/01 (2025-01-20) |
| Numbering Rule | default per jenis form (format dapat diubah di Setting, nomor urut otomatis — §5.5) |
| ShiftTemplate + Shift | Preset `S3` = 3 shift (`06:00/14:00/22:00`, slot 120 mnt → 12 slot Patrol) + preset `S2` (2 shift `07:00/19:00`) + `S1` + `NS` (FR-03a AC10) |
| Numbering Mode | CS-02 & CS-05 default `KEEP_ORIGINAL` (Q8, replikasi audit); template baru `SEQUENTIAL_BY_GROUP` |

- **AC1:** Nilai contoh (`PA 1300G`, `BLACK`, `Tidak kotor`) **tidak** masuk `actual`, melainkan
  `example_value` / `standard_text` sesuai konteks.
- AC2: Item `needs_verification` (weight 1.45) ditandai eksplisit; QA dapat memilih `TEMPLATE` (nilai
  1.45 ±0.04 sama dengan dokumen) atau `MANUAL_INPUT` (dikosongkan) tanpa deploy ulang (Q1).
- AC3: Seed menyertakan nilai default Setting (shift profile, numbering rules) tetapi **semuanya
  editable** dari UI oleh `ADMIN`/`MD_ADMIN`.

---

## 10. User Story Utama

| ID | Story | Prioritas |
|---|---|---|
| US-01 | Sebagai inspector incoming, saya mengisi checksheet COLLAR untuk 1 lot dan mendapat judgment final otomatis | P0 |
| US-02 | Sebagai inspector, saya mengisi checksheet PATROL tiap 2 jam untuk mesin saya dan sistem mengingatkan slot yang terlewat | P0 |
| US-03 | Sebagai inspector IDS, saya mengisi hasil ukur per cavity (1–8) dan melihat OK/NG per cavity | P0 |
| US-04 | Sebagai supervisor, saya men-checked dokumen inspector dan mengembalikannya dengan alasan | P0 |
| US-05 | Sebagai QC Manager, saya meng-approve dokumen dan mengunduh PDF 1:1 untuk arsip | P0 |
| US-06 | Sebagai admin, saya membuat template checksheet baru untuk part baru tanpa kode | P0 |
| US-07 | Sebagai admin, saya mengatur aturan penomoran dokumen | P0 |
| US-08 | Sebagai auditor, saya menelusuri semua checksheet sebuah lot dalam < 30 detik | P1 |
| US-09 | Sebagai inspector, saya melampirkan Mill Sheet/CoA pada checksheet material | P1 |
| US-10 | Sebagai admin, saya merevisi template dan melihat changelog perubahannya | P1 |
| US-11 | Sebagai admin, saya mengubah format nomor dokumen di Setting dan nomor urut bertambah otomatis | P0 |
| US-12 | Sebagai admin, saya mengatur jam operasi & shift per mesin di Setting sehingga slot waktu Patrol menyesuaikan | P0 |
| US-13 | Sebagai inspector, saya mengisi Standard/Tolerance secara manual untuk item yang dikonfigurasi `MANUAL_INPUT` | P1 |
| US-14 | Sebagai inspector, saya tidak kehilangan data walau koneksi terputus (autosave draft) | P0 |
| US-15 | Sebagai inspector patrol, saya menyalin header dari checksheet shift sebelumnya tanpa mengetik ulang | P1 |
| US-16 | Sebagai supervisor yang cuti, saya mendelegasikan approval ke rekan tanpa melanggar segregation of duties | P1 |
| US-17 | Sebagai admin, saya mengunggah master part massal dari CSV | P2 |
| US-18 | Sebagai admin QC, saya menambah material baru lewat upload file Excel tanpa mengetik satu-satu | P0 |
| US-19 | Sebagai admin, saya membuat checksheet baru untuk part baru 100% dari UI tanpa minta developer | P0 |
| US-20 | Sebagai QA, saya memilih mode penomoran `KEEP_ORIGINAL` agar PDF identik dengan dokumen audit | P0 |
| US-21 | Sebagai admin, saya menambahkan satu partner lalu menandainya sebagai Supplier **dan** Customer sekaligus | P0 |
| US-22 | Sebagai inspector, saya memilih supplier/customer mana pun dari dropdown yang sudah difilter peran | P0 |
| US-23 | Sebagai admin, saya meng-import Part dari Excel dan relasi material & supplier terbentuk otomatis | P0 |

| US-25 | Sebagai admin, saya membuat konfigurasi 2 shift atau 3 shift sesuai kebutuhan company | P0 |
| US-26 | Sebagai admin, saya menyusun jadwal kerja bulanan beserta hari libur (shift tetap) | P1 |
| US-27 | Sebagai inspector, saya melihat kalender jadwal shift saya untuk bulan berjalan | P2 |

---

## 11. Prioritas (MoSCoW)

| Prioritas | Item |
|---|---|
| **Must (P0)** | Auth+RBAC, **Master Business Partner modular (Company/Supplier/Customer)** + **Material** + Part + Mesin + Plant, **import Excel semua master + relasi otomatis**, **Setting: Penomoran + Jam Operasi/Shift + Retensi**, Template Engine (flat+matrix) **+ builder extensible**, 6 checksheet, validasi & judgment otomatis, approval 3 level, PDF 1:1, audit trail dasar, autosave draft, **`KEEP_ORIGINAL` mode** |
| **Should (P1)** | Laporan & filter, Excel 1:1, notifikasi email, revisi & doc control, lampiran dokumen, **standard manual (MANUAL_INPUT)**, **duplikasi checksheet**, **validasi lot**, **delegasi approval**, **kalender libur**, **export master round-trip** |
| **Could (P2)** | Reminder patrol otomatis, dashboard KPI, batch export ZIP, item bank, **rollback per batch import**, **arsip otomatis** |
| **Could (P2)** | Reminder patrol otomatis, dashboard KPI, batch export ZIP, item bank |
| **Won't (Fase 1)** | ERP/MES integration, SPC chart, OCR, mobile native, WhatsApp alert |

---

## 12. Asumsi & Dependensi

1. `qm.mantaris.id` tidak dijadikan acuan; sistem dirancang ulang dari analisa checksheet.
2. File Excel adalah sumber kebenaran struktur (identik dengan PDF).
3. Istilah bahasa asli dipertahankan walau UI bilingual, karena merupakan bagian dokumen resmi.
4. Multi-plant single-company, data terisolasi per plant.
5. Nilai `WEIGHT 1.45 ±0.04` di IDS **disamakan dengan dokumen atau dikosongkan** (keputusan Q1);
   mekanisme `standard_source` (FR-06 AC7) memungkinkan admin mengubahnya sendiri tanpa deploy.
6. Listrik/jaringan di area produksi memadai untuk web app; tersedia fallback simpan draft offline (P2).
7. **Jam operasi & shift adalah konfigurasi**, bukan konstanta kode (Q3). Sistem menyediakan nilai
   default yang dapat diubah kapan saja dari halaman Pengaturan.
8. **Format nomor dokumen sepenuhnya konfigurabel**, sedangkan nomor urut selalu otomatis (Q5).

---

## 13. Kriteria Penerimaan & Rencana Verifikasi

| ID | Kriteria | Verifikasi |
|---|---|---|
| T1 | Ke-6 template memuat **100% item** dari analisa (CS-01=7, CS-02=8, CS-03=10, CS-04=5, CS-05=19 chara×12 slot, CS-06=6 item×8 cavity) | Script pembanding template vs `00-analisa-checksheet.md` |
| T2 | PDF identik isi dengan dokumen asli | **UAT side-by-side** dengan QA, tanda tangan per form |
| T3 | Submit dengan field wajib kosong → ditolak | Test otomatis + manual |
| T4 | Nilai di luar range → NG otomatis | Test otomatis per tipe tolerance |
| T5 | Segregation of duties: inspector tidak bisa approve dokumennya sendiri | Test otomatis |
| T6 | Approved ⇒ immutable; percobaan edit ditolak | Test otomatis |
| T7 | Normalisasi penomoran tampil sesuai aturan §5.5 | UAT review daftar perubahan |
| T8 | Audit trail lengkap mencatat semua transisi | Review log |
| T9 | Patrol: sel NG tanpa remark → ditolak | Test otomatis |
| T10 | Bilingual: seluruh UI ID/EN tanpa teks hilang | Review screenshot per halaman |
| T11 | Autosave: putus koneksi saat mengisi → data draft tidak hilang | Simulasi network offline |
| T12 | Numbering: format diubah di Setting → nomor berikutnya otomatis berurutan & unik | Test konkurensi (2 user submit bersamaan) |
| T13 | Shift & Jadwal: konfigurasi 3 shift (06/14/22, slot 120) menghasilkan **12 slot identik** form asli | UAT (FR-03a AC1) |
| T14 | `MANUAL_INPUT`: Standard/Tolerance kosong di template → field wajib di form & judgment memakai input manual | Test otomatis |
| T15 | `KEEP_ORIGINAL`: PDF menampilkan `"1. 3 OQC DATA"` & `⑯⑰` duplikat **persis** seperti dokumen asli | UAT side-by-side (Q8) |
| T16 | Import Excel Material: file 100 baris (90 valid, 10 error) → 90 tersimpan, 10 dilaporkan | Test otomatis (Q2) |
| T17 | Business Partner modular: 1 partner ber-role ganda muncul di dropdown Supplier **dan** Customer; filter peran benar | Test otomatis (Q6/Q9) |
| T18 | Engine siap form baru: buat 1 checksheet baru dari UI Template Builder tanpa deploy | Demo/UAT (Q4) |
| T19 | Retensi: dokumen > 10 tahun berstatus `ARCHIVED`, tetap read-only & bisa dicari | Test otomatis (Q7) |
| T20 | Import Part dari Excel dengan kolom `material_code` & `supplier_code` → relasi terbentuk otomatis | Test otomatis (Q11) |
| T21 | Blok TTD PDF kiri menampilkan Supplier terpilih (mis. TOKAI RIKA), kanan menampilkan PLASESS | UAT (Q10) |
| T22 | Quick-add partner dari form checksheet → tersimpan ke master, langsung terpilih, tanpa duplikasi | Test otomatis (Q12) |

| T24 | Konfigurasi **2 shift** (07:00/19:00) menghasilkan slot Patrol berbeda tanpa perubahan kode | Test otomatis (FR-03a AC2) |
| T25 | Shift lintas tengah malam (22:00-06:00) memotong slot 22:00~24:00 + 24:00~02:00 dengan benar | Test otomatis (AC3) |
| T26 | holidays di WorkSchedule: slot tidak dihitung terlewat & reminder berhenti | Test otomatis (AC5) |
| T27 | Shift tetap: 3 shift menghasilkan slot sama setiap hari kerja; Sabtu/Minggu & hari libur kosong | Test otomatis (AC4) |

---

## 14. Risiko & Mitigasi

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| R1 | 3 layout + 2 pola data → engine terlalu kompleks | Tinggi | Model `layout_mode`; bangun `FLAT_TABLE` dulu, matrix menyusul di sprint berikut |
| R2 | Data master tercemar nilai contoh (CS-01, CS-03) | Sedang | Pisahkan `standard_text` vs `example_value`; review QA (T7) |
| R3 | Inkonsistensi penomoran form asli | Sedang | Mode normalisasi + changelog; opsi `KEEP_ORIGINAL` |
| R4 | PDF 1:1 sulit presisi (merge cell, kolom sempit) | Tinggi | Playwright HTML→PDF per form + UAT side-by-side (T2) |
| R5 | Nilai IDS weight diduga salah template | Rendah | **Sudah dimitigasi (Q1):** `standard_source` memungkinkan admin mengubah/mengosongkan sendiri dari UI tanpa deploy |
| R6 | Adopsi inspector di lantai produksi | Tinggi | Pelatihan, tablet, UI besar, reminder, pilot 2 checksheet dulu |
| R7 | Data historis lama (Excel) perlu tetap terlihat | Sedang | Import arsip read-only (Fase 2) atau lampiran PDF lama |
| R8 | Ketergantungan satu admin untuk template | Sedang | Item Bank + duplicate template + dokumentasi |
| R9 | Generator nomor otomatis bentrok saat banyak user submit bersamaan | Tinggi | Counter atomik di level database (row lock / `UPDATE ... RETURNING`) + unique constraint + test konkurensi (T12) |
| R10 | Konfigurasi Setting (shift/nomor) salah ubah → data baru jadi tidak konsisten | Sedang | Preview + validasi format + konfirmasi ganda untuk reset counter + audit trail |
| R11 | Kebingungan peran pada dokumen lama (PASI muncul sebagai supplier **dan** customer; TRSI sebagai customer sekaligus mold-code) | Sedang | **Sudah dimitigasi (Q9):** satu entitas `BusinessPartner` dengan `roles[]` — peran ganda menjadi sah, bukan ambigu. Badge peran + filter dropdown per peran (FR-02 AC3, AC8, AC9) |
| R12 | Import Excel material gagal separuh / data ganda masuk | Sedang | Preview + validasi per baris + mode `PARTIAL`/`ALL_OR_NOTHING` + kunci `material_code` unik + laporan hasil (FR-02a) |
| R13 | Template Builder terlalu bebas → admin membuat template tidak valid | Sedang | Validasi kelengkapan wajib (FR-06 AC9) + 3 template contoh teruji (AC10) + panduan (AC14) |
| R14 | `KEEP_ORIGINAL` membingungkan user (label ⑯⑰ duplikat terlihat seperti bug) | Rendah | Badge peringatan kontekstual (FR-05 AC6) + `sequence_key` internal terpisah (AC7) |

---

## 15. Pertanyaan Terbuka — Status

### 15.1 Sudah Dijawab User

| # | Pertanyaan | **Keputusan** | Dampak ke PRD |
|---|---|---|---|
| **Q1** | Apakah nilai `WEIGHT 1.45 ±0.04` pada IDS SLIDER benar? | **Disamakan dengan dokumen, atau dikosongkan agar diisi manual oleh checker.** | `Item.standard_source = TEMPLATE \| MANUAL_INPUT` (FR-06 AC7, FR-09 AC4, §9 AC2). |
| **Q2** | Apakah material `PP BOROUGH BF970A1+PH6728 DIC (MB) BLACK` final? | **Material diisi di Setting → Master Data Material; user bisa menambah langsung via file Excel.** | **FR-02a Master Material** + import Excel (AC1–AC11). `Part.material_id` merujuk ke master, bukan teks bebas. |
| **Q3** | Jam operasi & jumlah shift per mesin | **Diisi manual di Setting, dapat diubah sesuai kebutuhan** - akan ada 3 shift, dan harus mendukung company dengan sistem 2 shift (modular). | **FR-03a Master Shift & Jadwal Kerja**: `ShiftTemplate` + `Shift` + `WorkSchedule` + `MachineSchedule`, preset 1/2/3 shift & non-stop (AC1-AC12) |
| **Q4** | Apakah ada checksheet lain di luar 6 ini? | **Buatkan saja untuk jaga-jaga** (engine dibuat extensible). | FR-06 AC8–AC14: header/column/signature builder, row generator, `layout_mode` extensible, template clone, panduan. |
| **Q5** | Format nomor dokumen internal | **Format diatur di Setting; nomor urut otomatis berurutan.** | FR-05 diperluas: `doc_type`, `format_pattern`, `reset_period`, `next_value` read-only, `scope` (AC1–AC7). |
| **Q6** | Apakah approval TRSI & PLASESS harus orang berbeda? | **Bukan — TRSI adalah SUPPLIER, PLASESS adalah PENERIMA BARANG.** | Entitas peran dipisah tegas (FR-02). |
| **Q7** | Retensi dokumen | **Ya — 10 tahun.** | NFR Retensi: 10 tahun dapat diubah di Setting; `ARCHIVED` read-only setelah periode. |
| **Q8** | Apakah `KEEP_ORIGINAL` dibutuhkan? | **Butuh.** | FR-05 AC4–AC9: `KEEP_ORIGINAL` menjadi **P0**, replikasi eksak termasuk `"1. 3"` & duplikat `⑯⑰`. |
| **Q9** | Apakah `TRSI` & `PASI` tetap ada sebagai Customer? | **Tidak — semua modular. Company/Supplier/Customer semuanya modular, bisa di-setting user sesuai kebutuhan; customer & supplier dapat dipilih bebas.** | **`BusinessPartner` + `BusinessPartnerRole[]`** (FR-02 AC1–AC9). Satu partner bisa berperan ganda. Dropdown form difilter per peran. |
| **Q10** | `PT. TOKAI RIKA SAFETY INDONESIA` relasinya apa? | **Dia adalah supplier → jadikan pilihan supplier.** | FR-02 AC10–AC11: blok TTD kiri = partner `SUPPLIER` terpilih; `Plant.company_left` **dihapus**. |
| **Q11** | Import Excel material membuat relasi otomatis? | **Ya — semua master data bisa di-import dari Excel dan otomatis menjadi relasi di sistem.** | FR-02a AC8–AC14: import untuk Partner/Material/Part/Mesin/Plant/User; kolom relasi (`material_code`, `supplier_code`, `customer_code`, `plant_code`) di-resolve otomatis. |

### 15.2 Masih Terbuka

| # | Pertanyaan | Penanggung Jawab | Blocking untuk |
|---|---|---|---|
| Q12 | Ada partner yang tidak boleh tampil di dropdown customer meski punya role `CUSTOMER`? | **Tidak — semua bisa ditampilkan; dapat ditambahkan manual lalu di-update ke master data.** | FR-02 AC13: semua partner tampil di dropdown + **quick-add manual** yang langsung tersimpan ke Master Business Partner (anti-duplikasi via `name`, peran otomatis sesuai konteks, flag `created_via = QUICK_ADD`) |
| Q13 | Default `AUTO_CREATE` partner stub saat import? | **Manual saja** — tidak ada auto-create. | FR-02a AC9: referensi tak dikenal ⇒ `WARNING`/`PENDING_RELATION`, dibuat manual, ada tombol "Coba Lagi" |
| Q14 | Rollback per batch import di Fase 1? | **Cukup** (Fase 2). | FR-02a AC14 tetap P2 |

### 15.2 Masih Terbuka

| # | Pertanyaan | Penanggung Jawab | Blocking untuk |
|---|---|---|---|
| — | *(tidak ada pertanyaan blocking)* | — | — |

> **Semua pertanyaan produk (Q1–Q14) sudah terjawab.** PRD siap masuk tahap **Issue**.

---

## 16. Roadmap

| Fase | Isi |
|---|---|
| **F1 — MVP** | Engine template + 6 checksheet + validasi/judgment + approval 3 level + PDF 1:1 + master data + audit dasar |
| **F2** | Laporan & dashboard KPI, Excel 1:1, notifikasi, item bank, import arsip historis |
| **F3** | SPC/control chart, integrasi ERP/MES, OCR Mill Sheet, WhatsApp alert, mobile offline |

---

## 17. Alur Kerja Dokumen Wajib (Issue → Spec → Plan → Todo → Kerjakan)

**Aturan yang disepakati: tidak ada penulisan kode sebelum Issue dan Plan disetujui.**

Struktur folder:
```
docs/
├─ 00-analisa-checksheet.md      ← hasil ekstraksi 6 form (SUDAH ADA)
├─ prd.md                        ← dokumen ini
├─ issue/
│   ├─ ISSUE-0001-....md
│   └─ _template-issue.md
├─ spec/
│   └─ SPEC-0001-....md
├─ plan/
│   └─ PLAN-0001-....md
└─ todo/
    └─ TODO-0001-....md
```

**Gerbang (gate) tiap tahap:**

| Tahap | Artefak | Definisi Selesai (DoD) | Gerbang |
|---|---|---|---|
| 1. **Issue** | `docs/issue/ISSUE-xxxx.md` | Konteks, masalah, ruang lingkup, AC, estimasi, dependensi | **Approval user** |
| 2. **Spec** | `docs/spec/SPEC-xxxx.md` | Desain teknis: skema DB, kontrak API, state machine, komponen UI, strategi PDF, test plan | **Approval user** |
| 3. **Plan** | `docs/plan/PLAN-xxxx.md` | Breakdown milestone & sprint, urutan pekerjaan, risiko, dependency | **Approval user** |
| 4. **Todo** | `docs/todo/TODO-xxxx.md` | Daftar task atomik bercentang (`[ ]`) yang bisa dieksekusi langsung | **Approval user** |
| 5. **Kerjakan** | kode + test | Semua todo tercentang, test lulus, review kode | Acceptance user |

**Nomor issue:** mengikuti **Numbering Rule** sistem (lihat §5.5) — `ISSUE-{SEQ:4}`, `SPEC-{SEQ:4}`, dst.

**Backlog issue awal yang diusulkan** (akan ditulis detail setelah PRD disetujui):

| Issue | Judul | Prioritas |
|---|---|---|
| ISSUE-0001 | Fondasi proyek: Next.js + TS + PostgreSQL, auth, RBAC, i18n, struktur folder | P0 |
| ISSUE-0002 | Master data: **Business Partner modular (Company/Supplier/Customer)**, **Material**, Part, Mesin, Plant + **import Excel dengan relasi otomatis** + UI CRUD | P0 |
| ISSUE-0003 | **Setting engine**: Numbering Rules (format + auto sequence, mode `KEEP_ORIGINAL`) & **Master Shift + Jadwal Kerja modular (FR-03a)** & Retensi | **P0** |
| ISSUE-0004 | Template Engine `FLAT_TABLE` **+ Template Builder extensible** + seeder CS-01, CS-02, CS-03, CS-04 | P0 |
| ISSUE-0005 | Validasi & judgment otomatis + engine submit | P0 |
| ISSUE-0006 | Template Engine `MATRIX_TIME` (CS-05 Patrol) | P0 |
| ISSUE-0007 | Template Engine `MATRIX_CAVITY` (CS-06 IDS) | P0 |
| ISSUE-0008 | Alur approval 3 level + approval queue + audit trail | P0 |
| ISSUE-0009 | Export PDF 1:1 (6 form) + Excel | P0 |
| ISSUE-0010 | Laporan & pencarian/traceability | P1 |
| ISSUE-0011 | Sketsa & lampiran dokumen (upload, storage) | P1 |
| ISSUE-0012 | Notifikasi & reminder patrol | P2 |

---

## 18. Glosarium

| Istilah | Arti |
|---|---|
| **Chara (キャラ)** | Poin karakteristik kualitas yang wajib dicek; kolom ①..⑲ pada Patrol |
| **Chokotei (直行停止)** | Kondisi berhenti langsung / abnormality yang harus dicatat pada Patrol |
| **Pokayoke** | Mekanisme pencegahan salah proses; dicek sebagai item |
| **QCP** | Quality Control Plan |
| **WI / WS** | Work Instruction / Work Standard |
| **MSC** | Material Specification Control |
| **Mold / M/C** | Cetakan / Mesin |
| **OH** | Overall Height / nilai standar life dies |
| **2S** | Seiri–Seiton (ringkas–rapi) |
| **First & Last (F.L)** | Pengecekan pada awal dan akhir lot/proses |
| **IDS** | Inspection Data Sheet |
| **Mill Sheet / CoA / SoC** | Sertifikat material dari supplier / Certificate of Analysis / Statement of Compliance |
| **Judgment** | Hasil OK / NG (kadang `√`) |
| **Sampling Qty** | Jumlah sampel yang diperiksa per lot |
| **Tolerance / Range** | Batas nilai yang diizinkan untuk item numerik |

---

## 19. Lampiran

- **A.** `docs/00-analisa-checksheet.md` — ekstraksi teknis lengkap 6 checksheet (cell-by-cell).
- **B.** Sumber dokumen: `E:\Mantaris\Master Format Check Sheet TAB\` (6 PDF + 6 Excel).
- **C.** Catatan: dokumen ini **belum** menyertakan desain DB/API/komponen — itu isi `SPEC-0001` dst.

---

**Status dokumen: MENUNGGU REVIEW USER.**
Setelah PRD ini disetujui → saya tulis `docs/issue/ISSUE-0001..` → `SPEC` → `PLAN` → `TODO` → implementasi.





