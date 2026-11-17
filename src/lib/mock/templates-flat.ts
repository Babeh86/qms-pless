/**
 * Definisi item checksheet — diturunkan persis dari dokumen asli
 * (docs/00-analisa-checksheet.md).
 *
 * Header form bersifat DINAMIS: template hanya menyimpan *definisi field*.
 * Semua nilai diisi user lewat dropdown master data atau input manual.
 */

export type InputType = "NUMBER" | "TEXT" | "JUDGEMENT" | "SELECT";

export interface CheckItem {
  /** Label nomor setelah normalisasi (FR-05 SEQUENTIAL_BY_GROUP). */
  no?: string;
  /** Teks asli bila berbeda dari `no` (mode KEEP_ORIGINAL). */
  originalNo?: string;
  detailCheck: string;
  standardText?: string;
  standardValue?: number | null;
  tolPlus?: number;
  tolMinus?: number;
  rangeMin?: number;
  rangeMax?: number;
  tool?: string;
  inputType: InputType;
  /** Jumlah nilai Actual per item (CS-04 = 3, CS-06 = cavity count). */
  valueCount?: number;
  subChecks?: string[];
  isRequired?: boolean;
  standardSource?: "TEMPLATE" | "MANUAL_INPUT";
  exampleValue?: string;
}

export interface CheckSection {
  title: string;
  items: CheckItem[];
}

/* ═══════════════════════════════════════════════════════════════
   HEADER FIELD
   ═══════════════════════════════════════════════════════════════ */

export type HeaderSource =
  | "PART"
  | "SUPPLIER"
  | "CUSTOMER"
  | "MATERIAL"
  | "MACHINE"
  | "MOLD"
  | "DATE"
  | "NUMBER"
  | "TEXT"
  | "DERIVED";

export interface HeaderField {
  key: string;
  label: string;
  source: HeaderSource;
  required?: boolean;
  placeholder?: string;
  suffix?: string;
  span?: 1 | 2 | 3 | 4;
}

export interface ChecksheetTemplate {
  code: string;
  title: string;
  docNo: string;
  effectiveDate: string;
  layout: "FLAT_TABLE" | "MATRIX_TIME" | "MATRIX_CAVITY";
  header: HeaderField[];
  sections: CheckSection[];
  notes: string[];
  revisionHistory: { rev: string; date: string; content: string; pic: string }[];
}

/* ═══════════════════════════════════════════════════════════════
   CS-01 — Inspection Incoming Material COLLAR
   ═══════════════════════════════════════════════════════════════ */

export const cs01Header: HeaderField[] = [
  { key: "partNo", label: "PART NO.", source: "PART", required: true, span: 2 },
  { key: "partName", label: "PART NAME", source: "DERIVED", span: 2 },
  { key: "supplier", label: "SUPPLIER NAME", source: "SUPPLIER", required: true, span: 2 },
  { key: "material", label: "MATERIAL", source: "DERIVED", span: 2 },
  { key: "kedatanganDate", label: "KEDATANGAN DATE", source: "DATE", required: true },
  { key: "inspectionDate", label: "INSPECTION DATE", source: "DATE", required: true },
  { key: "lotNo", label: "LOT NUMBER", source: "TEXT", required: true, placeholder: "LOT-YYYYMMDD-XXX" },
  { key: "poNo", label: "P/O NO", source: "TEXT", placeholder: "Nomor P/O" },
  { key: "samplingQty", label: "SAMPLING QTY", source: "NUMBER", suffix: "pcs/Lot", required: true },
  { key: "totalQty", label: "TOTAL QTY", source: "NUMBER", suffix: "pcs", required: true },
];

export const cs01Sections: CheckSection[] = [
  {
    title: "1. Dokumen",
    items: [
      {
        no: "1.1",
        detailCheck: "PART NO",
        standardText: "Sesuai dokumen & aktual part",
        inputType: "TEXT",
      },
      {
        no: "1.2",
        detailCheck: "SEET DATA SUPPLIER",
        originalNo: "1. 2",
        standardText: "Terlampir",
        inputType: "TEXT",
        exampleValue: "Ada",
      },
    ],
  },
  {
    title: "2. Actual Parts",
    items: [
      {
        no: "2.1",
        originalNo: "1.1",
        detailCheck: "Diameter Luar",
        standardText: "Range ⌀ 16.75 – 16.80",
        rangeMin: 16.75,
        rangeMax: 16.8,
        tool: "Caliper",
        inputType: "NUMBER",
      },
      {
        no: "2.2",
        originalNo: "1.2",
        detailCheck: "Diameter Dalam",
        standardText: "Range ⌀ 7.20 – 7.25",
        rangeMin: 7.2,
        rangeMax: 7.25,
        tool: "Caliper",
        inputType: "NUMBER",
      },
      {
        no: "2.3",
        originalNo: "1.3",
        detailCheck: "Appearance (Check 1pcs/Box)",
        standardText: "Tidak salah part, Tidak Dented, Tidak Deform",
        inputType: "JUDGEMENT",
      },
    ],
  },
  {
    title: "3. Packing Kondisi",
    items: [
      {
        no: "3.1",
        originalNo: "2.1",
        detailCheck: "Kebersihan Box",
        standardText: "Tidak Dirty",
        inputType: "JUDGEMENT",
      },
      {
        no: "3.2",
        originalNo: "2.2",
        detailCheck: "Kondisi Box",
        standardText: "Tidak Basah, Tidak Rusak",
        inputType: "JUDGEMENT",
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   CS-02 — Inspection Incoming Material INSERT
   ═══════════════════════════════════════════════════════════════ */

export const cs02Header: HeaderField[] = [
  { key: "partNo", label: "PART NO.", source: "PART", required: true, span: 2 },
  { key: "partName", label: "PART NAME", source: "DERIVED", span: 2 },
  { key: "supplier", label: "SUPPLIER NAME", source: "SUPPLIER", required: true, span: 2 },
  { key: "material", label: "MATERIAL", source: "DERIVED", span: 2 },
  { key: "inspectionDate", label: "INSPECTION DATE", source: "DATE", required: true },
  { key: "etaDate", label: "ETA DATE", source: "DATE" },
  { key: "lotNo", label: "LOT NUMBER", source: "TEXT", required: true, placeholder: "LOT-YYYYMMDD-XXX" },
  { key: "poNo", label: "P/O NO", source: "TEXT", placeholder: "Nomor P/O" },
  { key: "samplingQty", label: "SAMPLING QTY", source: "NUMBER", suffix: "pcs", required: true },
  { key: "totalQty", label: "TOTAL QTY", source: "NUMBER", suffix: "pcs", required: true },
];

export const cs02Sections: CheckSection[] = [
  {
    title: "1. Dokumen",
    items: [
      { no: "1.1", detailCheck: "PART NO", standardText: "Sesuai dokumen & aktual part", inputType: "TEXT" },
      { no: "1.2", detailCheck: "SURFACE TREATMENT", standardText: "Yellow with Backing", inputType: "TEXT" },
      { no: "1.3", originalNo: "1. 3", detailCheck: "OQC DATA", standardText: "Attached", inputType: "TEXT" },
    ],
  },
  {
    title: "2. Actual Parts",
    items: [
      {
        no: "2.1",
        originalNo: "1.1",
        detailCheck: "Hole Diameter",
        standardText: "20 ± 0.2",
        standardValue: 20,
        tolPlus: 0.2,
        tolMinus: 0.2,
        rangeMin: 19.8,
        rangeMax: 20.2,
        inputType: "NUMBER",
      },
      {
        no: "2.2",
        originalNo: "1.2",
        detailCheck: "Thickness Mtrl",
        standardText: "3.2 ± 0.1",
        standardValue: 3.2,
        tolPlus: 0.1,
        tolMinus: 0.1,
        rangeMin: 3.1,
        rangeMax: 3.3,
        inputType: "NUMBER",
      },
      {
        no: "2.3",
        originalNo: "1.3",
        detailCheck: "Appearance",
        standardText: "No Dented, No Deform",
        inputType: "JUDGEMENT",
      },
    ],
  },
  {
    title: "3. Packing Condition",
    items: [
      { no: "3.1", originalNo: "2.1", detailCheck: "Kebersihan Box", standardText: "No Dirty", inputType: "JUDGEMENT" },
      { no: "3.2", originalNo: "2.2", detailCheck: "Kondisi Box", standardText: "No Wet, No Broken", inputType: "JUDGEMENT" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   CS-03 — Check Sheet Incoming Material PA 1300G
   ═══════════════════════════════════════════════════════════════ */

export const cs03Header: HeaderField[] = [
  { key: "material", label: "MATERIAL", source: "MATERIAL", required: true, span: 2 },
  { key: "supplier", label: "SUPPLIER NAME", source: "SUPPLIER", required: true, span: 2 },
  { key: "lotNo", label: "LOT NUMBER", source: "TEXT", required: true, placeholder: "Lot / Batch No." },
  { key: "deliveryNote", label: "DELIVERY NOTE", source: "TEXT", required: true, placeholder: "No. Surat Jalan" },
  { key: "inspectionDate", label: "INSPECTION DATE", source: "DATE", required: true },
  { key: "totalQty", label: "TOTAL QTY", source: "NUMBER", suffix: "Kgs.", required: true },
];

export const cs03Sections: CheckSection[] = [
  {
    title: "1. Dokumen",
    items: [
      { no: "1.1", detailCheck: "Nama Material", standardText: "Semua dokumen harus sama dengan aktual material", inputType: "TEXT", exampleValue: "PA 1300G" },
      { no: "1.2", detailCheck: "Lot No.", standardText: "Semua dokumen harus sama dengan aktual material", inputType: "TEXT" },
      { no: "1.3", detailCheck: "Kode Warna", standardText: "Semua dokumen harus sama dengan aktual material", inputType: "TEXT", exampleValue: "BLACK" },
      { no: "1.4", detailCheck: "Grade", standardText: "Semua dokumen harus sama dengan aktual material", inputType: "TEXT", exampleValue: "1300G" },
      { no: "1.5", detailCheck: "Delivery Note", standardText: "Sesuai aktual material", inputType: "JUDGEMENT" },
    ],
  },
  {
    title: "2. Sertifikat (Mill Sheet / CoA)",
    items: [
      { no: "2.1", detailCheck: "Sertifikat (Mill sheet / COA)", standardText: "Jika Diperlukan", inputType: "TEXT", exampleValue: "Ada (via Email)" },
      { no: "2.2", detailCheck: "Grade", standardText: "Sesuai aktual material", inputType: "TEXT", exampleValue: "1300G" },
    ],
  },
  {
    title: "3. Dokumen SoC",
    items: [
      { no: "3.1", detailCheck: "Dokumen SoC (khusus new material)", standardText: "Ada", inputType: "TEXT", exampleValue: "Refer to database SOC" },
    ],
  },
  {
    title: "4. Kondisi Packing",
    items: [
      { no: "4.1", detailCheck: "Kebersihan bag", standardText: "Tidak kotor", inputType: "JUDGEMENT" },
      {
        no: "4.2",
        detailCheck: "Kondisi bag",
        originalNo: "4. Atau 5 Kondisi Packing",
        inputType: "JUDGEMENT",
        subChecks: ["- Tidak basah", "- Jahitan bag tidak lepas", "- Tidak bolong"],
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   CS-04 — Materials Incoming Inspection Sheet PRESS
   ═══════════════════════════════════════════════════════════════ */

export const cs04Header: HeaderField[] = [
  { key: "partNo", label: "PART CODE", source: "PART", required: true, span: 2 },
  { key: "partName", label: "PART NAME", source: "DERIVED", span: 2 },
  { key: "supplier", label: "VENDOR NAME", source: "SUPPLIER", required: true, span: 2 },
  { key: "customer", label: "CUSTOMER", source: "CUSTOMER", span: 2 },
  { key: "material", label: "MATERIAL GRADE & SIZE", source: "MATERIAL", required: true, span: 2 },
  { key: "lotNo", label: "LOT NO.", source: "TEXT", required: true, placeholder: "Lot No." },
  { key: "toCheckedPackingNo", label: "TO CHECKED PACKING NO.", source: "TEXT", placeholder: "Packing No." },
  { key: "groupPackingNo", label: "GROUP OR PACKING NO.", source: "TEXT", placeholder: "Group / Packing" },
  { key: "inspectionDate", label: "INSPECTION DATE", source: "DATE", required: true },
];

export const cs04Sections: CheckSection[] = [
  {
    title: "Inspection Point",
    items: [
      { no: "1", detailCheck: "MATERIAL NAME", standardText: "Sesuai label material", tool: "REFER TO LABEL", inputType: "TEXT" },
      {
        no: "2",
        detailCheck: "t = 0.15 ± 0.02",
        standardText: "0.13 ~ 0.17",
        standardValue: 0.15,
        tolPlus: 0.02,
        tolMinus: 0.02,
        rangeMin: 0.13,
        rangeMax: 0.17,
        tool: "MICROMETER",
        inputType: "NUMBER",
        valueCount: 3,
      },
      {
        no: "3",
        detailCheck: "W = 27 ± 0.20",
        standardText: "26.80 ~ 27.20",
        standardValue: 27,
        tolPlus: 0.2,
        tolMinus: 0.2,
        rangeMin: 26.8,
        rangeMax: 27.2,
        tool: "VERNIER CALIPER",
        inputType: "NUMBER",
        valueCount: 3,
      },
      { no: "4", detailCheck: "MATERIAL TYPE", standardText: "COIL", tool: "VISUAL", inputType: "TEXT", exampleValue: "Berat (Kgs.)" },
      { no: "5", detailCheck: "APPEARANCE", standardText: "NO RUSTY, DENTED, SCRATCH", tool: "VISUAL (EYE)", inputType: "JUDGEMENT" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   Builder — menghasilkan ChecksheetTemplate
   ═══════════════════════════════════════════════════════════════ */

export const cs01: ChecksheetTemplate = {
  code: "CS-01",
  title: "Inspection Incoming Material COLLAR",
  docNo: "CS-PR-05-QAD-01D /00",
  effectiveDate: "01-08-2025",
  layout: "FLAT_TABLE",
  header: cs01Header,
  sections: cs01Sections,
  notes: [
    "1. Kolom Actual please write base on actual result",
    '2. Column Judgment please give mark "√" based on actual judgment.',
  ],
  revisionHistory: [{ rev: "0", date: "2025-08-01", content: "New Release", pic: "Dian" }],
};

export const cs02: ChecksheetTemplate = {
  code: "CS-02",
  title: "Inspection Incoming Material INSERT",
  docNo: "CS-PR-05-QAD-01A / 04",
  effectiveDate: "15-11-2016",
  layout: "FLAT_TABLE",
  header: cs02Header,
  sections: cs02Sections,
  notes: [
    "1. Kolom Actual please write base on actual result",
    '2. Column Judgment please give mark "√" based on actual judgment.',
  ],
  revisionHistory: [{ rev: "4", date: "2016-11-15", content: "Revision 4", pic: "Dian" }],
};

export const cs03: ChecksheetTemplate = {
  code: "CS-03",
  title: "Check Sheet Incoming Material PA 1300G",
  docNo: "CS-PR-05-QAD-01A / 06",
  effectiveDate: "02-01-2026",
  layout: "FLAT_TABLE",
  header: cs03Header,
  sections: cs03Sections,
  notes: ['1. Pada kolom "Note", tulis sesuai dengan aktual'],
  revisionHistory: [{ rev: "6", date: "2026-01-02", content: "Efektif 02.01.2026", pic: "Dian" }],
};

export const cs04: ChecksheetTemplate = {
  code: "CS-04",
  title: "Materials Incoming Inspection Sheet — PRESS",
  docNo: "CS-PR-05-QAD-01B/00",
  effectiveDate: "23-12-2022",
  layout: "FLAT_TABLE",
  header: cs04Header,
  sections: cs04Sections,
  notes: ["Dokumen selesai ketika pengecekan kedatangan material beserta dengan sertifikat."],
  revisionHistory: [{ rev: "0", date: "2022-12-23", content: "New Release", pic: "Dian" }],
};
