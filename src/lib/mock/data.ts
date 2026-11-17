import type {
  BusinessPartner,
  Checksheet,
  Machine,
  Material,
  NumberingRule,
  Part,
  Shift,
  ShiftTemplate,
  WorkSchedule,
} from "./types";

/**
 * Dataset mock — diturunkan dari analisa 6 checksheet
 * (docs/00-analisa-checksheet.md) + keputusan PRD v1.6 (Q1–Q14).
 *
 * CATATAN: data ini statis, hanya untuk pengembangan UI.
 * Ganti dengan query server saat backend disambungkan kembali.
 */

// ─────────────── Business Partner (modular — Q6/Q9/Q10/Q12) ───────────────

export const businessPartners: BusinessPartner[] = [
  {
    id: "bp-001",
    code: "PLASESS",
    name: "PT. PLASESS INDONESIA",
    shortName: "PLASESS",
    roles: ["COMPANY"],
    address: "Karawang, Jawa Barat",
    city: "Karawang",
    contactPerson: "QA Department",
    isSystemOwner: true,
    createdVia: "MANUAL",
    isActive: true,
  },
  {
    id: "bp-002",
    code: "PASI",
    name: "PT. PASI",
    shortName: "PASI",
    roles: ["SUPPLIER", "CUSTOMER"],
    city: "Bekasi",
    supplierType: "PART",
    createdVia: "MANUAL",
    isActive: true,
  },
  {
    id: "bp-003",
    code: "TRSI",
    name: "TRSI",
    shortName: "TRSI",
    roles: ["SUPPLIER", "CUSTOMER"],
    city: "Jakarta",
    supplierType: "PART",
    createdVia: "MANUAL",
    isActive: true,
  },
  {
    id: "bp-004",
    code: "KMPI",
    name: "PT. KMPI",
    shortName: "KMPI",
    roles: ["SUPPLIER"],
    city: "Cikarang",
    supplierType: "MATERIAL",
    createdVia: "MANUAL",
    isActive: true,
  },
  {
    id: "bp-005",
    code: "YHT",
    name: "PT. Yahata Fastener Indonesia",
    shortName: "Yahata",
    roles: ["SUPPLIER"],
    city: "Cibitung",
    supplierType: "PART",
    createdVia: "MANUAL",
    isActive: true,
  },
  {
    id: "bp-006",
    code: "TOKAI_RIKA",
    name: "PT. TOKAI RIKA SAFETY INDONESIA",
    shortName: "Tokai Rika",
    roles: ["SUPPLIER"],
    city: "Karawang",
    supplierType: "PART",
    createdVia: "MANUAL",
    isActive: true,
  },
  {
    id: "bp-007",
    code: "SUP-0001",
    name: "PT. Sumber Makmur Sejahtera",
    shortName: "Sumber Makmur",
    roles: ["SUPPLIER"],
    city: "Purwakarta",
    supplierType: "PART",
    createdVia: "QUICK_ADD",
    isActive: true,
  },
  {
    id: "bp-008",
    code: "SUP-0002",
    name: "CV. Baja Nusantara",
    roles: ["SUPPLIER"],
    supplierType: "MATERIAL",
    createdVia: "QUICK_ADD",
    isActive: false,
  },
];

// ─────────────── Material (Q2) ───────────────

export const materials: Material[] = [
  {
    id: "mat-001",
    code: "PA1300G",
    name: "PA 1300G",
    grade: "1300G",
    materialType: "RESIN",
    color: "BLACK",
    defaultUnit: "Kgs.",
    supplierCode: "KMPI",
    isActive: true,
  },
  {
    id: "mat-002",
    code: "C1720-XHMB-AU",
    name: "C1720-XHMB AU",
    grade: "C1720-XHMB AU",
    materialType: "METAL_COIL",
    sizeSpec: "0.15 x 27 x COIL",
    defaultUnit: "Kgs.",
    supplierCode: "KMPI",
    isActive: true,
  },
  {
    id: "mat-003",
    code: "TRPOM11-POM1C",
    name: "TRPOM11 POM-1C NO.P-9801",
    grade: "POM-1C",
    materialType: "RESIN",
    color: "NATURAL",
    defaultUnit: "Kgs.",
    supplierCode: "TRSI",
    isActive: true,
  },
  {
    id: "mat-004",
    code: "PP-BOROUGH-BF970A1",
    name: "PP BOROUGH BF970A1",
    grade: "BF970A1",
    materialType: "RESIN",
    color: "BLACK",
    additiveMasterbatch: "+PH6728 DIC (MB)",
    defaultUnit: "Kgs.",
    supplierCode: "PASI",
    isActive: true,
  },
];

// ─────────────── Part (FR-01) ───────────────

export const parts: Part[] = [
  {
    id: "part-001",
    partNo: "7145-0040-0w",
    partName: "COLLAR",
    materialId: "mat-003",
    supplierCode: "PASI",
    defaultCavityCount: 1,
    isActive: true,
  },
  {
    id: "part-002",
    partNo: "730409-5310",
    partName: "Anchor Through",
    materialId: "mat-003",
    supplierCode: "YHT",
    defaultCavityCount: 1,
    isActive: true,
  },
  {
    id: "part-003",
    partNo: "7176-2680-30",
    partName: "A PILLAR PROTECTOR BASE",
    model: "468B",
    materialId: "mat-004",
    supplierCode: "PASI",
    customerCode: "PASI",
    defaultCavityCount: 1,
    isActive: true,
  },
  {
    id: "part-004",
    partNo: "7L0990-0280",
    partName: "SLIDER, PT",
    model: "D13PF",
    materialId: "mat-003",
    supplierCode: "TOKAI_RIKA",
    customerCode: "TRSI",
    defaultCavityCount: 8,
    moldCode: "TRSI-0041",
    drawingRev: "10",
    isActive: true,
  },
];

// ─────────────── Mesin (FR-03) ───────────────

export const machines: Machine[] = [
  {
    id: "mc-001",
    machineNo: "IJ-01",
    type: "INJECTION_HORIZONTAL",
    tonnage: 150,
    plantCode: "KRW",
    shiftTemplateCode: "S3",
    isActive: true,
  },
  {
    id: "mc-002",
    machineNo: "IJ-02",
    type: "INJECTION_VERTICAL",
    tonnage: 80,
    plantCode: "KRW",
    shiftTemplateCode: "S3",
    isActive: true,
  },
  {
    id: "mc-003",
    machineNo: "IJ-03",
    type: "INJECTION_HORIZONTAL",
    tonnage: 250,
    plantCode: "KRW",
    shiftTemplateCode: "S3",
    isActive: true,
  },
  {
    id: "mc-004",
    machineNo: "PR-01",
    type: "PRESS",
    tonnage: 60,
    plantCode: "KRW",
    shiftTemplateCode: "S2",
    isActive: true,
  },
];

// ─────────────── Shift & Jadwal Kerja (FR-03a) ───────────────

export const shiftTemplates: ShiftTemplate[] = [
  {
    id: "st-001",
    code: "S3",
    name: "3 Shift",
    shiftCount: 3,
    slotDurationMinutes: 120,
    totalHoursPerDay: 24,
    isActive: true,
  },
  {
    id: "st-002",
    code: "S2",
    name: "2 Shift",
    shiftCount: 2,
    slotDurationMinutes: 120,
    totalHoursPerDay: 24,
    isActive: true,
  },
  {
    id: "st-003",
    code: "S1",
    name: "1 Shift",
    shiftCount: 1,
    slotDurationMinutes: 120,
    totalHoursPerDay: 8,
    isActive: true,
  },
  {
    id: "st-004",
    code: "NS",
    name: "Non-stop",
    shiftCount: 3,
    slotDurationMinutes: 120,
    totalHoursPerDay: 24,
    isActive: true,
  },
];

export const shifts: Shift[] = [
  // 3 shift: 06/14/22 — menghasilkan 12 slot (sesuai form asli)
  { id: "sh-1", templateCode: "S3", shiftNo: 1, name: "Shift 1", startTime: "06:00", endTime: "14:00", durationMinutes: 480, crossesMidnight: false, isNightShift: false },
  { id: "sh-2", templateCode: "S3", shiftNo: 2, name: "Shift 2", startTime: "14:00", endTime: "22:00", durationMinutes: 480, crossesMidnight: false, isNightShift: false },
  { id: "sh-3", templateCode: "S3", shiftNo: 3, name: "Shift 3", startTime: "22:00", endTime: "06:00", durationMinutes: 480, crossesMidnight: true, isNightShift: true },
  // 2 shift: 07/19
  { id: "sh-4", templateCode: "S2", shiftNo: 1, name: "Shift 1", startTime: "07:00", endTime: "19:00", durationMinutes: 720, crossesMidnight: false, isNightShift: false },
  { id: "sh-5", templateCode: "S2", shiftNo: 2, name: "Shift 2", startTime: "19:00", endTime: "07:00", durationMinutes: 720, crossesMidnight: true, isNightShift: true },
  // 1 shift: 08-16
  { id: "sh-6", templateCode: "S1", shiftNo: 1, name: "Shift 1", startTime: "08:00", endTime: "16:00", durationMinutes: 480, crossesMidnight: false, isNightShift: false },
];

export const workSchedules: WorkSchedule[] = [
  {
    id: "ws-001",
    code: "WS-JAN26-KRW",
    name: "Jadwal Januari 2026 — Karawang",
    plantCode: "KRW",
    shiftTemplateCode: "S3",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-01-31",
    workDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
    holidays: ["2026-01-01"],
    isActive: true,
  },
  {
    id: "ws-002",
    code: "WS-JAN26-PRESS",
    name: "Jadwal Press Januari 2026",
    plantCode: "KRW",
    shiftTemplateCode: "S2",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-01-31",
    workDays: ["MON", "TUE", "WED", "THU", "FRI"],
    holidays: ["2026-01-01"],
    isActive: true,
  },
];

// ─────────────── Numbering Rules (FR-05) ───────────────

export const numberingRules: NumberingRule[] = [
  { id: "nr-001", docType: "CHECK_SHEET", formatPattern: "{PREFIX}/{YYYY}{MM}/{PLANT}/{SEQ:4}", resetPeriod: "MONTHLY", padding: 4, nextValue: 128, scope: "PER_PLANT", isActive: true },
  { id: "nr-002", docType: "LOT", formatPattern: "LOT-{YYYY}{MM}{DD}-{SEQ:3}", resetPeriod: "DAILY", padding: 3, nextValue: 12, scope: "PER_PLANT", isActive: true },
  { id: "nr-003", docType: "ISSUE", formatPattern: "ISSUE-{SEQ:4}", resetPeriod: "NEVER", padding: 4, nextValue: 4, scope: "GLOBAL", isActive: true },
  { id: "nr-004", docType: "SPEC", formatPattern: "SPEC-{SEQ:4}", resetPeriod: "NEVER", padding: 4, nextValue: 2, scope: "GLOBAL", isActive: true },
  { id: "nr-005", docType: "PLAN", formatPattern: "PLAN-{SEQ:4}", resetPeriod: "NEVER", padding: 4, nextValue: 2, scope: "GLOBAL", isActive: true },
  { id: "nr-006", docType: "TODO", formatPattern: "TODO-{SEQ:4}", resetPeriod: "NEVER", padding: 4, nextValue: 2, scope: "GLOBAL", isActive: true },
];

// ─────────────── Checksheet (header) ───────────────

export const checksheets: Checksheet[] = [
  {
    id: "cs-0001",
    number: "CS/202601/KRW/0128",
    formCode: "CS-01",
    formName: "Incoming Material COLLAR",
    category: "INCOMING",
    partNo: "7145-0040-0w",
    partName: "COLLAR",
    supplierCode: "PASI",
    lotNo: "LOT-20260130-011",
    inspectionDate: "2026-01-30",
    status: "APPROVED",
    finalJudgment: "OK",
    inspectorName: "QC Inspector 1",
    checkedByName: "QC Supervisor 1",
    approvedByName: "QC Manager 1",
    totalItems: 7,
    ngItems: 0,
  },
  {
    id: "cs-0002",
    number: "CS/202601/KRW/0127",
    formCode: "CS-02",
    formName: "Incoming Material INSERT",
    category: "INCOMING",
    partNo: "730409-5310",
    partName: "Anchor Through",
    supplierCode: "YHT",
    lotNo: "LOT-20260130-010",
    inspectionDate: "2026-01-30",
    status: "CHECKED",
    finalJudgment: "OK",
    inspectorName: "QC Inspector 1",
    checkedByName: "QC Supervisor 1",
    totalItems: 8,
    ngItems: 0,
  },
  {
    id: "cs-0003",
    number: "CS/202601/KRW/0126",
    formCode: "CS-03",
    formName: "Incoming Material PA 1300G",
    category: "INCOMING",
    partNo: "—",
    partName: "PA 1300G",
    supplierCode: "KMPI",
    lotNo: "LOT-20260129-009",
    inspectionDate: "2026-01-29",
    status: "SUBMITTED",
    finalJudgment: "OK",
    inspectorName: "QC Inspector 1",
    totalItems: 10,
    ngItems: 1,
  },
  {
    id: "cs-0004",
    number: "CS/202601/KRW/0125",
    formCode: "CS-04",
    formName: "Materials Incoming PRESS",
    category: "INCOMING",
    partNo: "17M036-0030",
    partName: "CONTACT TURN & WIPER",
    supplierCode: "KMPI",
    lotNo: "LOT-20260129-008",
    inspectionDate: "2026-01-29",
    status: "APPROVED",
    finalJudgment: "OK",
    inspectorName: "QC Inspector 1",
    checkedByName: "QC Supervisor 1",
    approvedByName: "QC Manager 1",
    totalItems: 5,
    ngItems: 0,
  },
  {
    id: "cs-0005",
    number: "CS/202601/KRW/0124",
    formCode: "CS-05",
    formName: "QC Patrol — Injection",
    category: "IN_PROCESS",
    partNo: "7176-2680-30",
    partName: "A PILLAR PROTECTOR BASE",
    customerName: "PASI",
    machineNo: "IJ-01",
    lotNo: "LOT-20260129-007",
    inspectionDate: "2026-01-29",
    status: "SUBMITTED",
    finalJudgment: "NG",
    inspectorName: "QC Inspector 1",
    totalItems: 228,
    ngItems: 3,
  },
  {
    id: "cs-0006",
    number: "CS/202601/KRW/0123",
    formCode: "CS-06",
    formName: "Inspection Data Sheet — SLIDER PT",
    category: "IN_PROCESS",
    partNo: "7L0990-0280",
    partName: "SLIDER, PT",
    customerName: "TRSI",
    machineNo: "IJ-03",
    lotNo: "LOT-20260128-006",
    inspectionDate: "2026-01-28",
    status: "APPROVED",
    finalJudgment: "OK",
    inspectorName: "QC Inspector 1",
    checkedByName: "QC Supervisor 1",
    approvedByName: "QC Manager 1",
    totalItems: 48,
    ngItems: 0,
  },
  {
    id: "cs-0007",
    number: "CS/202601/KRW/0122",
    formCode: "CS-05",
    formName: "QC Patrol — Injection",
    category: "IN_PROCESS",
    partNo: "7176-2680-30",
    partName: "A PILLAR PROTECTOR BASE",
    customerName: "PASI",
    machineNo: "IJ-02",
    lotNo: "LOT-20260128-005",
    inspectionDate: "2026-01-28",
    status: "REJECTED",
    finalJudgment: "NG",
    inspectorName: "QC Inspector 1",
    checkedByName: "QC Supervisor 1",
    totalItems: 228,
    ngItems: 8,
  },
];

// ─────────────── Helper ───────────────

export function partnerByCode(code?: string): BusinessPartner | undefined {
  if (!code) return undefined;
  return businessPartners.find((p) => p.code === code);
}

export function materialById(id: string): Material | undefined {
  return materials.find((m) => m.id === id);
}

export function formCodeLabel(code: string): string {
  return code;
}
