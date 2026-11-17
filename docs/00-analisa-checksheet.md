# Analisa Checksheet — Master Format Check Sheet TAB

> Status: **HASIL EKSTRAKSI TEKNIS** (belum PRD). Dokumen ini adalah bahan analisa mentah hasil parsing
> file PDF/XLS/XLSX di `E:\Mantaris\Master Format Check Sheet TAB`.
> Catatan: PDF tidak dapat dibaca langsung oleh model (butuh vision/OCR), sehingga struktur diambil dari
> file Excel pendamping yang isinya identik dengan PDF (1:1 untuk semua 6 checksheet).

---

## 0. Inventaris File

| # | File | Tipe | Sheets | Ukuran grid |
|---|------|------|--------|-------------|
| 1 | CHECK SHEET INCOMING COLLAR 0040 | Incoming | `0040` | A1:AO52 (41 kol) |
| 2 | CHECK SHEET INCOMING INSERT 5310 | Incoming | `5310` | A1:AJ52 (36 kol) |
| 3 | CHECK SHEET INCOMING MATERIAL PA 1300G (SAME) | Incoming (material) | `05.PA 1300G` | A1:I54 (9 kol) |
| 4 | CHECK SHEET INCOMING PRESS 17M036-0030 CONTAC TURN | Incoming (material/coil) | `60` | 56 x 15 |
| 5 | CHECK SHEET PATROL 7176-2680-30 A PILLAR PROT BASE | Patrol (proses) | `57` | A2:CB63 (80 kol) |
| 6 | IDS 7L0990-0280_SLIDER PT | Inspection Data Sheet (proses) | `8 Cavity` | A1:AK66 (37 kol) |

**Temuan penting:** ada 2 (dua) *keluarga form* yang berbeda secara struktural:

- **Keluarga A — Incoming Material (Dokumen/Visual)** → #3 (PA 1300G) dan #4 (PRESS coil). Berbasis
  dokumen: Delivery Note, Mill Sheet/CoA, SoC, kondisi packing. Tidak ada dimensi per-part cavity.
- **Keluarga B — Incoming Part (Dimensional + Visual)** → #1 (COLLAR) dan #2 (INSERT). Header berpasangan
  (PART NO / PART NAME / ETA DATE / SUPPLIER / TOTAL QTY / tanggal-lot-PO-sampling), lalu 3 grup item:
  `1. Dokumen`, `2. Actual Parts`, `3. Packing Condition`, plus `Sketch / Picture` dan blok tanda tangan.
- **Keluarga C — In-process / Patrol** → #5 (Patrol per jam) dan #6 (IDS per cavity). Ini yang paling
  kompleks: matriks jam × chara, dan matriks cavity × dimensi.

---

## 1. Detail Struktur per Checksheet

### 1.1 CS-01 — INSPECTION INCOMING MATERIAL COLLAR

- **Judul:** `INSPECTION INCOMING MATERIAL COLLAR`
- **Identitas:** PART NO `7145-0040-0w` · PART NAME `COLLAR` · SUPPLIER `PT. PASI` · SAMPLING QTY `1 pcs/Lot`
- **Field input header (kosong):** KEDATANGAN DATE, LOT NUMBER, P/O NO, TOTAL QTY
- **Kolom tabel:** `ITEM CHECK | DETAIL CHECK | STANDARD | ACTUAL | JUDGMENT (OK | NG)`
- **Item:**

| Item Check | Detail Check | Standard | Satuan/Alat |
|---|---|---|---|
| 1. Dokumen | 1.1 PART NO | `7145-0040-0w` | — |
| | (sub) | `- Delivery` / `Note` / `- Seet Data Supplier` | — |
| | 1.2 SEET DATA SUPPLIER | `Terlampir` | — |
| 2. Actual Parts | 1.1 Diameter Luar | `Range 16.75 – 16.80` | Caliper |
| | 1.2 Diameter Dalam | `Range 7.20 – 7.25` | Caliper |
| | 1.3 Appearance *(Check 1pcs/Box)* | `Tidak salah part, Tidak Dented, Tidak Deform` | Visual |
| 3. Packing Kondisi | 2.1 Kebersihan Box | `Tidak Dirty` | Visual |
| | 2.2 Kondisi Box | `Tidak Basah, Tidak Rusak` | Visual |

- **Sketch/Picture:** ada placeholder gambar + dimensi `⌀ 16,75` dan `⌀ 7,23`
- **Final Judgment:** ☐ OK ☐ NG (di area kanan bawah)
- **Tanda tangan:** `Approved` | `Checked` | `Inspector`
- **Footer:** `Doc. No : CS-PR-05-QAD-01D /00` · `Effective Date : 01-08-2025`
- **Catatan form:** "Kolom Actual please write base on actual result"; "Column Judgment please give mark
  \"√\" base on actual judgment."

> ⚠️ **Temuan / bug di form asli:** ditemukan nilai `Actual` yang sudah terisi dicetak (mis.
> `AA13='Tidak'`, `U21`, `U24`, `U26`) — sepertinya ini sisa pengisian contoh yang ikut tersimpan di master.
> Saat digitalisasi, field Actual **harus** selalu kosong pada template.

### 1.2 CS-02 — INSPECTION INCOMING MATERIAL INSERT

- **Judul:** `INSPECTION INCOMING MATERIAL INSERT`
- **Identitas:** PART NO `730409-5310` · PART NAME `Anchor Through` · SUPPLIER `PT. Yahata Fastener Indonesia`
- **Field input header (kosong):** INSPECTION DATE, LOT NUMBER, ETA DATE, P/O NO, SAMPLING QTY, TOTAL QTY
- **Kolom tabel:** sama (`ITEM CHECK | DETAIL CHECK | STANDARD | ACTUAL | JUDGMENT OK|NG`)
- **Item:**

| Item Check | Detail Check | Standard | Tolerance |
|---|---|---|---|
| 1. Dokumen | 1.1 PART NO | `730409-5310` | — |
| | 1.2 SURFACE TREATMENT | `Yellow with Backing` | — |
| | 1.3 OQC DATA | `Attached` | — |
| 2. Actual Parts | 1.1 Hole Diameter | `20` | ± 0.2 |
| | 1.2 Thickness Mtrl | `3.2` | ± 0.1 |
| | 1.3 Appearance | `No Dented, No Deform` | — |
| 3. Packing Condition | 2.1 Kebersihan Box | `No Dirty` | — |
| | 2.2 Kondisi Box | `No Wet, No Broken` | — |

- **Perbedaan dengan CS-01:** ada `Final Judgment` (OK/NG) di baris 29, **tidak ada** blok Sketch/Picture
  bergambar (hanya label), dan sub-dokumen memakai `Note` + `OQC Data` (bukan Delivery/Seet Data).
- **Footer:** `Doc. No : CS-PR-05-QAD-01A / 04` · `Effective Date : 15-11-2016`

> ⚠️ **Temuan:** penomoran detail-check tidak konsisten di form asli — grup "1. Dokumen" berisi `1.1, 1.2`
> lalu melompat ke `1. 3`; grup "2. Actual Parts" mengulang dari `1.1` lagi (bukan `2.1`). Ini perlu
> diputuskan: **direplikasi apa adanya** atau **dinormalisasi**. (Masuk pertanyaan interview.)

### 1.3 CS-03 — CHECK SHEET INCOMING MATERIAL PA 1300G (SAME)

- **Layout milik sendiri (9 kolom), bukan layout COLLAR/INSERT.**
- **Header:** `PART NO/PART NAME` di `D2` (merged D2:I2) — di master **kosong**, `EFFECTIVE` di footer
- **Kolom:** `ITEM CHECK | CHECK ITEM | STANDARD | ACTUAL | JUDGMENT OK|NG` — judul kolom
  `D` = standard, `E/F` = actual, `H/I` = OK/NG
- **Item:**

| Item Check | Check Item | Standard | Catatan |
|---|---|---|---|
| 1. Dokumen (Delivery, Note/Surat Jalan) | 1.1 Nama Material | Semua dokumen harus sama dengan aktual material | contoh: `PA 1300G` |
| | 1.2 Lot No. | (sama) | — |
| | 1.3 Kode Warna | (sama) | contoh: `BLACK` |
| | 1.4 Grade | (sama) | contoh: `1300G` |
| | 1.5 Delivery Note | Sesuai aktual material | — |
| 2. Sertifikat (Mill Sheet/CoA) | 2.1 Sertifikat | Jika Diperlukan | contoh: `Ada` / via `Email` |
| | 2.2 Grade | Sesuai aktual material | contoh: `1300G` |
| 3. Dokumen SoC | 3.1 Dokumen SoC *(khusus new material)* | `Ada` | `Refer to database SOC` |
| 4. Kondisi Packing | 4.1 Kebersihan bag | Tidak kotor | — |
| | 4.2 Kondisi bag | - Tidak basah / - Jahitan bag tidak lepas / - Tidak bolong | 3 sub-kondisi |

- **Final Judgement:** baris 25 (`OK` di H25:I25, `NG` di ...)
- **Keterangan:** `1. Pada kolom "Note", tulis sesuai dengan aktual`
- **Tanda tangan:** `KARAWANG,` + `Approved by` / `Checked by` / `Issued by`
- **Footer:** `CS-PR-05-QAD-01A / 06` · `Efektif : 02.01.2026`

> ⚠️ **Temuan:** kolom ACTUAL di form ini berisi **contoh nilai terisi** (`PA 1300G`, `BLACK`, `Ada`,
> `Tidak kotor`...). Perlu dipisah: mana **STANDARD/baku** vs mana **contoh pengisian**. Pada digitalisasi
> harus dipisah tegas, jika tidak inspector akan bingung.
> ⚠️ Nama item check #4 tertulis `"4. Atau 5        Kondisi Packing"` — kemungkinan typo/template sisa.

### 1.4 CS-04 — MATERIALS INCOMING INSPECTION SHEET (PRESS 17M036-0030)

- **Layout ketiga yang berbeda** (15 kolom, lega untuk coil).
- **Header:** DOCUMENT NO `CS-PR-05-QAD-01B/00` · EFFECTIVE DATE `23-12-2022` · LOT NO · APPROVED ·
  CHECKED · ISSUED · PART CODE/PART NAME `17M036-0030 / CONTACT TURN & WIPER` · VENDOR `PT. KMPI` ·
  CUSTOMER `PT. TOKAI RIKA INDONESIA` · MATERIAL GRADE & SIZE `C1720-XHMB AU [0.15 x 27 x COIL]`
- **Kolom tabel:** `INSPECTION POINT NO | DESCRIPTION | CONTROL ITEM OR SPEC | LIMIT | TOOL | RESULT | Judgment | REMARK`
- **Item:**

| No | Description | Spec | Limit | Tool | Remark |
|---|---|---|---|---|---|
| 1 | MATERIAL NAME | `C1720-XHMB AU` / `Au 1-Side SP2` | — | REFER TO LABEL | — |
| 2 | (thickness) | `t = 0.15 ± 0.02` | `0.13 ~ 0.17` | MICROMETER | RESULT punya 3 baris (1./2./3.) |
| 3 | (width) | `W = 27 ± 0.20` | `26.80 ~ 27.20` | VERNIER CALIPER | RESULT 3 baris |
| 4 | MATERIAL TYPE | `COIL` | — | VISUAL | `IDENTIFY RECEIVED WEIGHT HERE … Kgs.` |
| 5 | APPEARANCE | `NO RUSTY, DENTED, SCRATCH` | — | VISUAL (EYE) | — |

- **Remark footer:** "Dokumen selesai ketika pengecekan kedatangan material beserta dengan sertifikat."
- **Revision block:** `MARK | REVISION | DATE | REVISION RECORD | APPROVED | CHECKED | ISSUED` (kosong)
- **Company:** `PT. PLASESS INDONESIA`

> ⚠️ **Temuan:** field `RESULT` untuk item 2 & 3 adalah **deretan hasil pengukuran berulang** (3 titik
> sampel: 1./2./3.), bukan satu nilai. Ini butuh model data multi-nilai per item.

### 1.5 CS-05 — QC PATROL CHECK SHEET (INJECTION HORIZONTAL – VERTICAL)

Ini yang **paling kompleks**.

- **Header:** `57` (nomor form) · Part Name `A PILLAR PROTECTOR BASE` · Part No `7176-2680-30` ·
  Model `468B` · Cavity `1` · Material `PP BOROUGH BF970A1+PH6728 DIC (MB) BLACK` · M/C No ·
  Date · Approve · Check · Customer `PASI`
- **Struktur matriks:**
  - **Baris** = 12 slot waktu: `06:00~08:00, 08:00~10:00, 10:00~12:00, 12:00~14:00, 14:00~16:00,
    16:00~18:00, 18:00~20:00, 20:00~22:00, 22:00~24:00, 24:00~02:00, 02:00~04:00, 04:00~06:00`
    plus baris `First Shot` (Start / R/S / fraction) dan `Last Shot` (Finish / fraction).
  - **Kolom** = 19 *chara* (chokotei/pokayoke point), dikelompokkan:

| Kol | Grup | Point check |
|---|---|---|
| ① | M/C Condition | Master condition sesuai actual di MC monitor |
| ② | | Supervisi sesuai range <Supervisi ON, Temp barel ±5°C, mold temp +5/-10°C> |
| ③ | | Material sesuai MSC & sesuai part yang masspro |
| ④ | | LIFE DIES RECORD, tidak melebihi std OH |
| ⑤ | | Primary ON, std sesuai Mcond, ketelitian 0.1 |
| ⑥ | APPEARANCE STANDARD | Opening permit IN L,M protection harus OFF |
| ⑦ | | Point check NG (refer sample & QCP) — hati-hati part pernah claim customer |
| ⑧ | | Tidak burr di area penting (Parting Line, Lock, other), burry 0.5 max |
| ⑨ | | Tidak short shot di area penting dan last fill material |
| ⑩ | | Operator melakukan pengecekan sesuai QCP |
| ⑪ | | WI / WS pokayoke dijalankan |
| ⑫ | | Operator melakukan pekerjaan dengan 1 cycle |
| ⑬ | | NG part dibuang di box merah, tidak mixing dengan OK part |
| ⑭ | | Pemastian 2S area meja operator tidak ada part/label berbeda |
| ⑮ | | CHECK DATE MARK dan di CETAK |
| ⑯ | PACKAGING | Sesuaikan part dan label (tidak salah label / salah warna label) |
| ⑰ | PACKAGING | Inner label tidak salah, pokayoke inners dijalankan |
| ⑱ | PACKAGING | Pokayoke packing sesuai WI (hati-hati part similar) |
| ⑲ | PACKAGING | Penggunaan JIG QTY sesuai WI |
| — | PIC PATROL | nama petugas |
| — | REMARK | \*Jika muncul chokotei, tuliskan Tipe, Waktu dan Hasil Judgement visual shot ke-6 (vertikal) / shot ke-11 (horizontal) |

> ⚠️ **Temuan:** label nomor ⑯⑰ **duplikat** di form asli (`BE8='⑯'`, `BH8='⑰'` padahal sebelumnya
> `AY8='⑯'`, `BB8='⑰'`). Penomoran chara di form ini perlu dinormalisasi (masuk pertanyaan interview).

- **Footer:** `Eff date: 20-03-2023` · `CS-PR-07-QAD-237/02`
- **Revisi history:** Rev 0 Initial release (ACHMAD) · Rev 1 Pokayoke packing · Rev 2 Opening permit ON
- **Blok TTD:** `PT. TOKAI RIKA SAFETY INDONESIA` (Approved/Checked/Staff/Judgement/Note) dan
  `PT. PLASESS INDONESIA` (Approved/Checked/Inspector)

### 1.6 CS-06 — INSPECTION DATA SHEET (IDS) 7L0990-0280

- **Header:** MOLD CODE `TRSI-0041` · CUSTOMER `TRSI` · MODEL `D13PF` · CAV `8` ·
  Doc `CS-PR-02-ENG-28/01` · `2025-01-20`
- **Header-2:** PART NO `7L0990-0280` · PART NAME `SLIDER, PT` · DRAWING REV `10` ·
  MATERIAL `TRPOM11 POM-1C NO.P-9801` · COLOR `NATURAL`
- **Header proses:** PROSES INSP `INJECTION PROSES` · LOT NO · INSPECTION DATE · START/FINISH INSP ·
  INSPECTOR · PAGE `1/1` · INSPECTION TIME
- **Kolom tabel:**
  `No | Item check | Dimension | Tolerance (+ / -) | Range | Freq. | Meas. Tool | Area | CAVITY 1..8 | Judge | Remark`
- **Item & data:**

| No | Item | Dimension | Tol +/− | Range | Freq | Tool | Area |
|---|---|---|---|---|---|---|---|
| 1 | Distance | `2.9` | +0.11 / −0.1 | `2.8 – 3.01` | F.L | X | PLI, TRSI |
| 2 | Distance | `9.3` | +0.1 / −0.11 | `9.19 – 9.4` | F.L | X | a,b,c,d (PLI) + a,b,c,d (TRSI) |
| 3 | Appearance | No burr / Flash / Sink Mark and Warps | — | — | F.L | Visual | PLI, TRSI |
| 4 | Material | `TRPOM11 POM-1C NO.P-9801` | — | — | F.L | Visual | PLI, TRSI |
| 5 | Color | `Natural` | — | — | F.L | Visual | PLI, TRSI |
| 6 | Weight | `1.45` | +0.04 / −0.04 | `1.41 – 1.49` | F.L | Scale | PLI, TRSI |

- **Matriks input = CAVITY 1–8** (kolom Y..AF) → 8 nilai per item per baris.
- **Blok TTD:** `PT. TOKAI RIKA SAFETY INDONESIA` & `PT. PLASESS INDONESIA` (Approved/Checked/Staff/
  Judgement/Note)
- **Revisi:** Rev 0 · 2025-08-14 · New Release (Betman/Melon/Dian)

> ⚠️ **Temuan:** `WEIGHT 1.45 ±0.04` **identik** dengan `WEIGHT` di CS-05 (part berbeda! A PILLAR vs
> SLIDER). Salah satu kemungkinan copy-paste dari template. Perlu verifikasi user.
> ⚠️ Baris "Distance 9.3" punya 8 sub-baris (a,b,c,d × PLI/TRSI) sehingga satu item = 8 baris, bukan 1.

---

## 2. Analisa Lintas-Form (untuk desain sistem)

### 2.1 Elemen yang berulang di semua form
1. **Header identitas**: Part No, Part Name, Supplier/Customer, tanggal, lot/PO, sampling qty, total qty.
2. **Baris item check** dengan pasangan `Standard` (spec) + `Actual` (input) + `Judgment` (OK/NG).
3. **Blok tanda tangan** berjenjang: Approved / Checked / Inspector (+ Staff).
4. **Doc No + Effective Date + Revision history** di footer.
5. **Remark / Keterangan** + daftar instruksi pengisian.

### 2.2 Dua pola data fundamental
| Pola | Form | Model data |
|---|---|---|
| **Flat (1 baris = 1 check)** | CS-01, CS-02, CS-03, CS-04 | `item → standard → actual → judgment` |
| **Matrix (N baris × M kolom & sel)** | CS-05 (jam × chara), CS-06 (item × cavity) | butuh grid sel + agregasi judgment |

**Implikasi arsitektur:** jangan hardcode 6 halaman. Buat **engine checksheet berbasis template**:
`Template → Section → Item → (Standard, Tolerance, Tool, Freq, Actual[1..n]) → Judgment`,
dengan `layout_mode = flat | matrix_time | matrix_cavity`.

### 2.3 Perbedaan dokumen yang harus diakomodasi
| Aspek | Incoming Part (A) | Incoming Material (B) | Patrol/IDS (C) |
|---|---|---|---|
| Nomor form | CS-PR-05-QAD-01A/01D | 01A/06, 01B/00 | CS-PR-07-QAD-237/02, CS-PR-02-ENG-28/01 |
| Satuan entitas | Lot kedatangan | Lot kedatangan (coil/bag) | Per jam patrol / per inspection |
| Visual | Appearance text | Dokumen + packing | Chara/pokayoke + QCP |
| Approval | 3 kolom | 3 kolom (+KARAWANG) | 3 kolom × 2 perusahaan |
| Sketch | Ya (CS-01) | Tidak | Tidak |

---

## 3. Traceability ke Web qm.mantaris.id

Karena screenshot tidak dapat saya baca, saya gunakan *inferensi dari konvensi umum QMS* + nama domain
(`qm` = quality management, `mantaris` = grup manufaktur). Tolong koreksi bila meleset.

Struktur yang **paling mungkin** ada di qm.mantaris.id dan perlu dipetakan:

| Modul qm.mantaris.id (dugaan) | Fungsi | Irisan dengan 6 checksheet |
|---|---|---|
| Master Part / Item | Part No, Part Name, Model, Customer | header CS-01..06 |
| Master Supplier | Vendor (PASI, KMPI, Yahata) | header CS-01..04 |
| Master Check Sheet / Template | Definisi item check & standard | **inti dari 6 form ini** |
| Inspection Incoming | Input hasil cek kedatangan | CS-01..04 |
| Inspection In-process / Patrol | Input cek proses per jam | CS-05, CS-06 |
| Approval / Sign-off | Approved / Checked / Inspector | blok TTD semua form |
| Report & Export | Cetak PDF/Excel format asli | semua form |
| Document Control | Doc No + Effective Date + revisi | footer semua form |

**Kesimpulan arah:** 6 checksheet ini adalah **instance template** pada modul *Check Sheet Master*,
bukan 6 menu terpisah. Pekerjaan utama ada di **template engine + renderer layout**, bukan di 6 form.

---

## 4. Risiko & Pertanyaan Terbuka (dibawa ke interview)

| # | Isu | Dampak |
|---|---|---|
| R1 | 3 layout form berbeda + 2 pola data (flat & matrix) | tidak bisa 1 komponen generik sederhana |
| R2 | Actual/Standar tercampur di master (CS-01, CS-03) | risiko data kotor & bingung inspector |
| R3 | Penomoran item/〆 tidak konsisten (CS-02, CS-05) | replikasi vs normalisasi |
| R4 | Field multi-nilai (RESULT 1./2./3. di CS-04; cavity 1–8 di CS-06) | model data array |
| R5 | Weight 1.45 ±0.04 identik di 2 part berbeda | kemungkinan salah template |
| R6 | Sketch/Picture (CS-01) berupa gambar | butuh upload/attach per template |
| R7 | Revision history & Doc No terkait document control | butuh modul/entitas revisi |
| R8 | Export harus **persis** layout kertas asli (untuk audit) | butuh PDF/Excel renderer presisi |
| R9 | 2 perusahaan dalam 1 form (TRSI & PLASESS) | multi-tenant / multi-plant approval |
