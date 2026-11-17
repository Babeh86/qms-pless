# ISSUE-0002a — Master Business Partner (Modular: Company / Supplier / Customer) + Quick-Add

| Atribut | Nilai |
|---|---|
| ID | ISSUE-0002a |
| Induk | ISSUE-0002 (dipecah — disetujui 2026-01-30) |
| Tipe | `FEATURE` |
| Prioritas | `P0` |
| Status | `PLANNED` — **DISETUJUI** (2026-01-30) |
| Terkait PRD | **FR-02** (Business Partner modular), FR-02 AC13 (quick-add) |
| Dependensi | ISSUE-0001 (auth, RBAC, plant, audit) |
| Estimasi | **M** — 2 hari |

## 1. Latar Belakang
Pada dokumen asli, peran pihak ketiga ambigu: `PT. PASI` = supplier (CS-01) sekaligus customer (CS-05);
`TRSI` = customer (IDS) sekaligus supplier (Q6) dan prefix mold code; `PT. PLASESS INDONESIA` = penerima
barang; `PT. TOKAI RIKA SAFETY INDONESIA` = supplier (Q10). PRD Q9 memutuskan **satu entitas dengan peran jamak**.

## 2. Ruang Lingkup
- Entitas `BusinessPartner` + `BusinessPartnerRole[]` (`COMPANY` | `SUPPLIER` | `CUSTOMER`).
- CRUD + UI list/detail dengan badge peran, filter per peran, pencarian.
- Atribut spesifik peran (`is_system_owner` untuk COMPANY; `supplier_type` untuk SUPPLIER;
  `customer_type` untuk CUSTOMER).
- **Quick-add** dari dropdown mana pun + flag `created_via = QUICK_ADD` + daftar "Perlu Dilengkapi".
- Anti-duplikasi: deteksi `name` mirip → tawarkan *menambahkan peran* ke record existing.
- Soft-delete / `isActive`; larangan menonaktifkan company owner.
- API: list (filter peran, search, paginate), detail, create, update, tambah/hapus peran.

## 3. Kriteria Penerimaan
- [ ] AC1: 1 partner bisa memiliki >1 peran; seed `PASI` = `[SUPPLIER, CUSTOMER]`.
- [ ] AC2: `code` unik global; tidak boleh ada 2 record dengan code sama untuk peran berbeda.
- [ ] AC3: Penambahan/penghapusan peran kapan saja dari UI, tercatat di audit trail.
- [ ] AC4: Minimal 1 partner ber-role `COMPANY` dengan `is_system_owner = true` (PLASESS); tidak bisa dinonaktifkan.
- [ ] AC5: Dropdown (dipakai issue lain) hanya menampilkan partner yang relevan peran konteks;
      **semua** partner berperan terkait tampil (Q12).
- [ ] AC6: Quick-add dari form: minimal `name`; `code` auto (`SUP-0001`); peran otomatis sesuai konteks;
      langsung terpilih; tanpa duplikasi (dites).
- [ ] AC7: Partner `created_via = QUICK_ADD` muncul di daftar "Perlu Dilengkapi".
- [ ] AC8: Deaktivasi partner tidak merusak referensi transaksi lama.
- [ ] AC9: Semua mutasi tercatat di Audit Trail.
- [ ] AC10: Test: unit (validasi peran, anti-duplikasi), integration (CRUD + quick-add), E2E (buat partner peran ganda).

## 4. Dampak Teknis
- Skema: `BusinessPartner`, `BusinessPartnerRole`, enum `PartnerRole`, `SupplierType`, `CustomerType`, `CreatedVia`.
- UI: `/master/partners` (list, filter peran, detail), komponen `PartnerSelect` (dipakai lintas modul).
- API: `/api/partners`, `/api/partners/[id]`, `/api/partners/[id]/roles`, `/api/partners/quick-add`.

## 5. Risiko
| Risiko | Dampak | Mitigasi |
|---|---|---|
| Peran ganda membingungkan | Sedang | Badge peran + peringatan konteks (FR-02 AC9) |
| Duplikasi beda ejaan (`PT. PASI` vs `PASI`) | Tinggi | Normalisasi nama + fuzzy warning, bukan auto-merge |
| Quick-add membuat data tidak lengkap | Sedang | Flag `created_via` + daftar "Perlu Dilengkapi" |

## 6. Keputusan Dibutuhkan (Spec)
| # | Pertanyaan | Usulan |
|---|---|---|
| Q1 | Normalisasi `code` | uppercase + trim |
| Q2 | Quick-add wajib email/telepon? | Tidak — hanya `name` |
| Q3 | Auto-code format | `SUP-0001` / `CUS-0001` / `CMP-0001` per peran |
| Q4 | Threshold fuzzy match | Levenshtein ≤ 2 dari nama ternormalisasi |

## 7. Gerbang
- [x] **Review user disetujui** — 2026-01-30 → `docs/spec/SPEC-0002a.md`

