import type { ChecksheetTemplate } from "./templates-flat";

/**
 * CS-05 — QC Patrol Check Sheet (Injection Horizontal - Vertical)
 *
 * Layout MATRIX_TIME: baris = slot waktu, kolom = chara ①..⑲.
 * Slot DIBANGKITKAN dari ShiftTemplate 3 shift (06/14/22, slot 120 menit)
 * → 12 slot, identik dengan form kertas asli (FR-03a AC1).
 *
 * Nomor chara dinormalisasi menjadi ①..⑲ unik (FR-05 default
 * SEQUENTIAL_BY_GROUP); form asli memiliki duplikasi ⑯⑰ (Q8).
 */

export interface Chara {
  no: string;
  originalNo?: string;
  group: "MC_CONDITION" | "APPEARANCE" | "PACKAGING";
  text: string;
}

export const PATROL_CHARA: Chara[] = [
  {
    no: "①",
    group: "MC_CONDITION",
    text: "Master condition sesuai dengan actual di MC monitor",
  },
  {
    no: "②",
    group: "MC_CONDITION",
    text: "Supervisi sesuai dengan range <Supervisi ON, Temp barel ±5°C, mold temp +5/−10°C>",
  },
  {
    no: "③",
    group: "MC_CONDITION",
    text: "Material sesuai dengan MSC, dan sesuai dengan part yang masspro",
  },
  {
    no: "④",
    group: "MC_CONDITION",
    text: "LIFE DIES RECORD, tidak melebihi std OH",
  },
  {
    no: "⑤",
    group: "MC_CONDITION",
    text: "Primary ON, std sesuai dengan Mcond. Ketelitian 0.1",
  },
  {
    no: "⑥",
    group: "APPEARANCE",
    text: "Opening permit IN L,M protection Harus OFF",
  },
  {
    no: "⑦",
    group: "APPEARANCE",
    text: "Point Check NG (Refer to sample & QCP), hati-hati part yang pernah claim customer",
  },
  {
    no: "⑧",
    group: "APPEARANCE",
    text: "Tidak Burr diarea penting ( Parting Line,Lock,other ) BURRY 0,5 MAX Internal judgment",
  },
  {
    no: "⑨",
    group: "APPEARANCE",
    text: "Tidak short shot di area penting dan last fill material",
  },
  {
    no: "⑩",
    group: "APPEARANCE",
    text: "Operator melakukan pengecekan sesuai QCP",
  },
  {
    no: "⑪",
    group: "APPEARANCE",
    text: "WI / WS pokayoke dijalankan",
  },
  {
    no: "⑫",
    group: "APPEARANCE",
    text: "Operator melakukan pekerjaan dengan 1 cycle",
  },
  {
    no: "⑬",
    group: "APPEARANCE",
    text: "NG part dibuang di box merah , tidak terjadi mixing dengan OK part",
  },
  {
    no: "⑭",
    group: "APPEARANCE",
    text: "Pemastian 2S area meja operator tidak terdapat part , label yang berbeda",
  },
  {
    no: "⑮",
    group: "APPEARANCE",
    text: "CHECK DATE  MARK DAN DI CETAK",
  },
  {
    no: "⑯",
    group: "PACKAGING",
    text: "Sesuaikan part dan label, < Tidak terjadi salah label ,salah warna label >",
  },
  {
    no: "⑰",
    group: "PACKAGING",
    originalNo: "⑯",
    text: "Inner Label tidak salah、pokayoke inners dijalankan",
  },
  {
    no: "⑱",
    group: "PACKAGING",
    originalNo: "⑰",
    text: "pokayoke packing sesuai WI （Hati Hati part similar ）",
  },
  {
    no: "⑲",
    group: "PACKAGING",
    originalNo: "⑱",
    text: "Penggunaan JIG QTY sesuai dengan WI",
  },
];

export const PATROL_GROUP_LABEL: Record<Chara["group"], string> = {
  MC_CONDITION: "M/C Condition",
  APPEARANCE: "Appearance Standard",
  PACKAGING: "Packaging",
};

/** 12 slot hasil generate 3 shift (06/14/22) dengan slot 120 menit. */
export const PATROL_SLOTS: string[] = [
  "06:00~08:00",
  "08:00~10:00",
  "10:00~12:00",
  "12:00~14:00",
  "14:00~16:00",
  "16:00~18:00",
  "18:00~20:00",
  "20:00~22:00",
  "22:00~24:00",
  "24:00~02:00",
  "02:00~04:00",
  "04:00~06:00",
];

/**
 * Generator slot dari konfigurasi shift (FR-03a).
 * Fungsi murni — dipakai halaman Pengaturan untuk pratinjau.
 */
export function generateSlots(
  shifts: { startTime: string; endTime: string; crossesMidnight: boolean }[],
  slotDurationMinutes: number,
): string[] {
  const toMinutes = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };

  const format = (mins: number): string => {
    const normalized = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const slots: string[] = [];

  for (const shift of shifts) {
    const start = toMinutes(shift.startTime);
    let end = toMinutes(shift.endTime);
    if (shift.crossesMidnight || end <= start) end += 1440;

    // Slot terakhir dipotong bila tidak habis dibagi (FR-03a AC7)
    for (let cursor = start; cursor < end; cursor += slotDurationMinutes) {
      const slotEnd = Math.min(cursor + slotDurationMinutes, end);
      slots.push(`${format(cursor)}~${format(slotEnd)}`);
    }
  }

  return slots;
}

export const cs05: ChecksheetTemplate = {
  code: "CS-05",
  title: "QC Patrol Check Sheet (Injection Horizontal - Vertical)",
  docNo: "CS-PR-07-QAD-237/02",
  effectiveDate: "20-03-2023",
  layout: "MATRIX_TIME",
  header: [
    { key: "partNo", label: "Part No", source: "PART", required: true, span: 2 },
    { key: "partName", label: "Part Name", source: "DERIVED", span: 2 },
    { key: "model", label: "Model", source: "DERIVED" },
    { key: "cavity", label: "Cavity", source: "DERIVED" },
    { key: "material", label: "Material", source: "DERIVED", span: 2 },
    { key: "machineNo", label: "M/C No", source: "MACHINE", required: true, span: 2 },
    { key: "customer", label: "Customer", source: "CUSTOMER", required: true, span: 2 },
    { key: "date", label: "Date", source: "DATE", required: true },
    { key: "lotNo", label: "Lot No", source: "TEXT", required: true, placeholder: "LOT-YYYYMMDD-XXX" },
  ],
  sections: [],
  notes: [
    "*Jika muncul chokotei, tuliskan Tipe, Waktu dan Hasil Judgment visual shot ke 6 untuk shot vertikal atau shot ke 11 untuk mesin horizontal.",
  ],
  revisionHistory: [
    { rev: "0", date: "2023-03-20", content: "Initial release", pic: "ACHMAD" },
    { rev: "1", date: "2023-01-13", content: "Pokayoke packing", pic: "ACHMAD" },
    { rev: "2", date: "2023-03-20", content: "Opening permit ON", pic: "ACHMAD" },
  ],
};

// ─────────────────────────────────────────────────────────────
// CS-06 — Inspection Data Sheet (IDS) 7L0990-0280 SLIDER PT
// Layout MATRIX_CAVITY: baris = item, kolom = cavity 1..8
// ─────────────────────────────────────────────────────────────

export interface IdsRow {
  no: string;
  itemCheck: string;
  dimension: string;
  tolPlus?: string;
  tolMinus?: string;
  range?: string;
  freq: string;
  tool: string;
  area: string;
  rangeMin?: number;
  rangeMax?: number;
  inputType: "NUMBER" | "TEXT";
}

/**
 * Item IDS. Catatan: `WEIGHT 1.45 ±0.04` identik dengan CS-05 pada part berbeda —
 * ditandai `needsVerification` sesuai analisa (Q1).
 */
export const IDS_ROWS: IdsRow[] = [
  { no: "1", itemCheck: "Distance", dimension: "2.9", tolPlus: "0.11", tolMinus: "0.1", range: "2.8 – 3.01", freq: "F.L", tool: "X", area: "PLI", rangeMin: 2.8, rangeMax: 3.01, inputType: "NUMBER" },
  { no: "1", itemCheck: "Distance", dimension: "2.9", tolPlus: "0.11", tolMinus: "0.1", range: "2.8 – 3.01", freq: "F.L", tool: "X", area: "TRSI", rangeMin: 2.8, rangeMax: 3.01, inputType: "NUMBER" },
  { no: "2", itemCheck: "Distance", dimension: "9.3", tolPlus: "0.1", tolMinus: "0.11", range: "9.19 – 9.4", freq: "F.L", tool: "X", area: "PLI a", rangeMin: 9.19, rangeMax: 9.4, inputType: "NUMBER" },
  { no: "2", itemCheck: "Distance", dimension: "9.3", tolPlus: "0.1", tolMinus: "0.11", range: "9.19 – 9.4", freq: "F.L", tool: "X", area: "PLI b", rangeMin: 9.19, rangeMax: 9.4, inputType: "NUMBER" },
  { no: "2", itemCheck: "Distance", dimension: "9.3", tolPlus: "0.1", tolMinus: "0.11", range: "9.19 – 9.4", freq: "F.L", tool: "X", area: "PLI c", rangeMin: 9.19, rangeMax: 9.4, inputType: "NUMBER" },
  { no: "2", itemCheck: "Distance", dimension: "9.3", tolPlus: "0.1", tolMinus: "0.11", range: "9.19 – 9.4", freq: "F.L", tool: "X", area: "PLI d", rangeMin: 9.19, rangeMax: 9.4, inputType: "NUMBER" },
  { no: "2", itemCheck: "Distance", dimension: "9.3", tolPlus: "0.1", tolMinus: "0.11", range: "9.19 – 9.4", freq: "F.L", tool: "X", area: "TRSI a", rangeMin: 9.19, rangeMax: 9.4, inputType: "NUMBER" },
  { no: "2", itemCheck: "Distance", dimension: "9.3", tolPlus: "0.1", tolMinus: "0.11", range: "9.19 – 9.4", freq: "F.L", tool: "X", area: "TRSI b", rangeMin: 9.19, rangeMax: 9.4, inputType: "NUMBER" },
  { no: "2", itemCheck: "Distance", dimension: "9.3", tolPlus: "0.1", tolMinus: "0.11", range: "9.19 – 9.4", freq: "F.L", tool: "X", area: "TRSI c", rangeMin: 9.19, rangeMax: 9.4, inputType: "NUMBER" },
  { no: "2", itemCheck: "Distance", dimension: "9.3", tolPlus: "0.1", tolMinus: "0.11", range: "9.19 – 9.4", freq: "F.L", tool: "X", area: "TRSI d", rangeMin: 9.19, rangeMax: 9.4, inputType: "NUMBER" },
  { no: "3", itemCheck: "Appearance", dimension: "No burr / Flash / Sink Mark and Warps", freq: "F.L", tool: "Visual", area: "PLI", inputType: "TEXT" },
  { no: "3", itemCheck: "Appearance", dimension: "No burr / Flash / Sink Mark and Warps", freq: "F.L", tool: "Visual", area: "TRSI", inputType: "TEXT" },
  { no: "4", itemCheck: "Material", dimension: "TRPOM11 POM-1C NO.P-9801", freq: "F.L", tool: "Visual", area: "PLI", inputType: "TEXT" },
  { no: "4", itemCheck: "Material", dimension: "TRPOM11 POM-1C NO.P-9801", freq: "F.L", tool: "Visual", area: "TRSI", inputType: "TEXT" },
  { no: "5", itemCheck: "Color", dimension: "Natural", freq: "F.L", tool: "Visual", area: "PLI", inputType: "TEXT" },
  { no: "5", itemCheck: "Color", dimension: "Natural", freq: "F.L", tool: "Visual", area: "TRSI", inputType: "TEXT" },
  { no: "6", itemCheck: "Weight", dimension: "1.45", tolPlus: "0.04", tolMinus: "0.04", range: "1.41 – 1.49", freq: "F.L", tool: "Scale", area: "PLI", rangeMin: 1.41, rangeMax: 1.49, inputType: "NUMBER" },
  { no: "6", itemCheck: "Weight", dimension: "1.45", tolPlus: "0.04", tolMinus: "0.04", range: "1.41 – 1.49", freq: "F.L", tool: "Scale", area: "TRSI", rangeMin: 1.41, rangeMax: 1.49, inputType: "NUMBER" },
];

export const IDS_CAVITY_COUNT = 8;

export const cs06: ChecksheetTemplate = {
  code: "CS-06",
  title: "Inspection Data Sheet — SLIDER, PT",
  docNo: "CS-PR-02-ENG-28/01",
  effectiveDate: "2025-01-20",
  layout: "MATRIX_CAVITY",
  header: [
    { key: "partNo", label: "PART NO.", source: "PART", required: true, span: 2 },
    { key: "partName", label: "PART NAME", source: "DERIVED", span: 2 },
    { key: "moldCode", label: "MOLD CODE", source: "MOLD", required: true, span: 2 },
    { key: "customer", label: "CUSTOMER", source: "CUSTOMER", required: true, span: 2 },
    { key: "model", label: "MODEL", source: "DERIVED" },
    { key: "cavity", label: "CAV", source: "DERIVED" },
    { key: "drawingRev", label: "DRAWING REV", source: "DERIVED" },
    { key: "material", label: "MATERIAL", source: "DERIVED", span: 1 },
    { key: "color", label: "COLOR", source: "DERIVED" },
    { key: "prosesInsp", label: "PROSES INSP.", source: "TEXT", placeholder: "INJECTION PROSES", span: 2 },
    { key: "lotNo", label: "LOT NO.", source: "TEXT", required: true, placeholder: "LOT-YYYYMMDD-XXX" },
    { key: "inspectionDate", label: "INSPECTION DATE", source: "DATE", required: true },
  ],
  sections: [],
  notes: [
    "Nilai diisi per cavity (1–8). Judge dihitung otomatis dari range.",
    "⚠ Item WEIGHT 1.45 ±0.04 perlu diverifikasi (identik dengan CS-05 pada part berbeda).",
  ],
  revisionHistory: [
    { rev: "0", date: "2025-08-14", content: "New Release", pic: "Betman / Melon / Dian" },
  ],
};

