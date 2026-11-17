# ISSUE-0003 — Setting Engine: Numbering Rules, Master Shift & Jadwal Kerja, Retensi

| Atribut | Nilai |
|---|---|
| ID | ISSUE-0003 |
| Tipe | `FEATURE` |
| Prioritas | `P0` |
| Status | `PLANNED` — **DISETUJUI** (2026-01-30) — rotasi pola dikeluarkan |
| Terkait PRD | **FR-05** (Numbering Rules), **FR-03a** (Shift & Jadwal Kerja — modular), NFR Retensi (Q7) |
| Dependensi | ISSUE-0001 (fondasi), ISSUE-0002c (Machine, Plant) |
| Estimasi | **L** — 3–4 hari (disarankan dipecah bila perlu) |

## 1. Latar Belakang

Tiga kebutuhan konfigurasi yang menentukan perilaku sistem dan **tidak boleh di-hardcode**:

1. **Numbering Rules (Q5)** — format nomor dokumen diatur user di Setting; nomor urut otomatis berurutan.
   Ditambah **Q8**: mode `KEEP_ORIGINAL` wajib agar PDF identik dokumen audit.
2. **Shift & Jadwal Kerja (Q3 + permintaan baru)** — akan ada **3 shift**, tetapi sistem harus **modular**
   agar dapat dipakai company dengan **2 shift**. Slot waktu Patrol (CS-05) harus **dibangkitkan**, bukan konstanta.
3. **Retensi (Q7)** — 10 tahun, dapat diubah, status `ARCHIVED` read-only setelahnya.

## 2. Ruang Lingkup

### A. Numbering Rules (FR-05)
- `NumberingRule`: `doc_type` (`CHECK_SHEET`|`ISSUE`|`SPEC`|`PLAN`|`TODO`|`LOT`), `format_pattern`,
  `prefix`, `reset_period` (`YEARLY`|`MONTHLY`|`DAILY`|`PER_SHIFT`|`NEVER`), `padding`, `start_from`,
  `next_value` (**read-only**), `scope` (`PER_PLANT`|`GLOBAL`), `is_active`.
- Placeholder: `{PREFIX} {YYYY} {YY} {MM} {DD} {PLANT} {FORM_CODE} {DOC_TYPE} {SUPPLIER_CODE} {PART_NO} {SEQ:n}`.
- **Generator atomik** (row lock / `UPDATE ... RETURNING`) — aman konkurensi, gap-free, unik.
- Preview live 3 nomor berikutnya + validasi format.
- Override manual hanya `ADMIN` + alasan + audit.
- **Template numbering mode**: `SEQUENTIAL_BY_GROUP` | `KEEP_ORIGINAL` | `CUSTOM` (Q8, P0).

### B. Master Shift & Jadwal Kerja (FR-03a) ⭐
- `ShiftTemplate` — pola: `shift_count`, `cycle_pattern`, `slot_duration_minutes`, `total_hours_per_day`.
- `Shift` — `shift_no`, `start_time`, `end_time`, `duration_minutes`, `crosses_midnight`,
  `break_minutes`, `is_night_shift`, `grace_minutes`.
- `WorkSchedule` — `plant`, `shift_template`, `effective_from/to`, `work_days`, `holidays`
  (**shift tetap, tanpa rotasi pola**).
- `MachineSchedule` — penugasan jadwal ke mesin per periode.
- **Preset bawaan** (duplikatable): `3 Shift (06/14/22)`, `2 Shift (07/19)`, `1 Shift (08–16)`, `Non-stop`.
- **Slot generator** — fungsi murni `generateSlots(workSchedule, date)` → `['06:00~08:00', ...]`.
- Validasi: total durasi = `total_hours_per_day`; deteksi overlap; slot sisa dipotong.
- Kalender visual (bulan/grup), read-only untuk inspector.
- Import/export via engine ISSUE-0002d.

### C. Retensi (Q7)
- `Settings.retention_years` (default 10, dapat diubah).
- Job harian: dokumen melewati retensi → `ARCHIVED` (read-only), **tidak** dihapus.
- Audit log & checksheet `APPROVED` tidak pernah dihapus otomatis.

## 3. Kriteria Penerimaan

**Numbering**
- [ ] AC1: Format diubah di Setting → nomor berikutnya mengikuti format baru; nomor lama tidak berubah.
- [ ] AC2: Nomor urut **otomatis & berurutan**, unik, gap-free, aman saat 2 user submit bersamaan (T12).
- [ ] AC3: User tidak dapat mengetik nomor urut; override hanya ADMIN + alasan + audit.
- [ ] AC4: Preview live 3 nomor berikutnya; format tidak dikenal ditolak.
- [ ] AC5: Berlaku untuk semua `doc_type` (Checksheet, Issue, Spec, Plan, Todo, Lot).
- [ ] AC6: Reset counter dengan konfirmasi ganda + audit.
- [ ] AC7: `KEEP_ORIGINAL` mereplikasi `"1. 3 OQC DATA"` & duplikat `⑯⑰` secara eksak; `sequence_key` internal tetap unik.

**Shift & Jadwal**
- [ ] AC8: **3 shift (06/14/22, slot 120) menghasilkan 12 slot identik dengan form Patrol asli** (T13).
- [ ] AC9: **2 shift (07/19)** menghasilkan set slot berbeda **tanpa perubahan kode** (T24).
- [ ] AC10: Shift lintas tengah malam → slot `22:00~24:00` + `24:00~02:00` benar (T25).
- [ ] AC11: `holidays` → slot tidak dihitung terlewat & reminder berhenti (T26).
- [ ] AC12: Shift bersifat **tetap** — 3 shift menghasilkan slot sama tiap hari kerja; Sabtu/Minggu & hari libur kosong (T27).
- [ ] AC13: Overlap shift & total jam tidak konsisten → ditolak dengan pesan jelas.
- [ ] AC14: Preset 1/2/3 shift & non-stop dapat diduplikasi lalu diedit.
- [ ] AC15: Perubahan jadwal hanya berlaku untuk checksheet baru (snapshot lama utuh).
- [ ] AC16: Shift & jadwal dapat diimport/diekspor via engine 0002d.

**Retensi**
- [ ] AC17: Dokumen > 10 tahun → `ARCHIVED`, read-only, tetap dapat dicari & diekspor (T19).

**Umum**
- [ ] AC18: Semua mutasi Setting tercatat di Audit Trail.
- [ ] AC19: Test: unit (generator slot, atomik counter, parser format), integration, E2E.

## 4. Dampak Teknis

- Skema: `NumberingRule`, `Setting`, `ShiftTemplate`, `Shift`, `WorkSchedule`, `MachineSchedule`,
  `WorkScheduleGroup`; tambah `Machine.workScheduleId` (menggantikan `shiftProfileId`).
- Fungsi murni: `lib/numbering/generate.ts`, `lib/shift/generate-slots.ts` (mudah di-unit-test).
- API: `/api/settings/numbering`, `/api/settings/numbering/preview`, `/api/shifts`,
  `/api/shift-templates`, `/api/work-schedules`, `/api/work-schedules/[id]/calendar`,
  `/api/machine-schedules`, `/api/settings/retention`.
- UI: `/settings/numbering` (list + form + preview), `/settings/shifts` (template builder + shift editor),
  `/settings/work-schedules` (kalender + editor), `/settings/retention`.
- Job: `cron` harian untuk arsip retensi (idempotent).

## 5. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Counter bentrok saat submit bersamaan | Tinggi | Row-level lock / `UPDATE ... RETURNING` + unique constraint + test konkurensi |
| Generator slot salah untuk shift lintas hari | Tinggi | Fungsi murni + tabel kasus uji (3 shift, 2 shift, 1 shift, non-stop, lintas midnight) |
| Konfigurasi jadwal terlalu rumit untuk admin | Sedang | Preset siap pakai + kalender visual + validasi inline |
| Perubahan setting merusak data historis | Tinggi | Snapshot pada checksheet; setting hanya untuk dokumen baru |
| Arsip otomatis salah hapus | Tinggi | Tidak pernah hard-delete; hanya status `ARCHIVED` + audit |

## 6. Estimasi

- Kompleksitas: **L** (3–4 hari)
- Disarankan dipecah bila waktu ketat:
  - `0003a` Numbering Rules + mode `KEEP_ORIGINAL`
  - `0003b` Shift & Jadwal Kerja modular
  - `0003c` Retensi & arsip

## 7. Keputusan Dibutuhkan (Spec)

| # | Pertanyaan | Usulan |
|---|---|---|
| Q1 | Simpan `next_value` di tabel atau pakai PostgreSQL `SEQUENCE`? | Tabel + row lock (fleksibel per plant/period) |
| Q2 | Slot dipotong atau ditambah bila sisa? | Dipotong; validasi memberi peringatan |
| Q3 | `grace_minutes` per shift atau global? | Per shift, default 15 |
| Q4 | ~~Rotasi grup~~ | **Tidak berlaku** — shift tetap (keputusan user) |
| Q5 | Job arsip: cron internal atau manual? | Cron harian + tombol manual |

## 8. Gerbang

- [x] **Review user disetujui** — 2026-01-30 → `docs/spec/SPEC-0003.md`


