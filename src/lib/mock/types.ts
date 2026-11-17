/**
 * Tipe domain untuk layer frontend (mock data).
 * Mengikuti model PRD v1.6 — lihat docs/prd.md §6.
 */

export type PartnerRole = "COMPANY" | "SUPPLIER" | "CUSTOMER";
export type SupplierType = "PART" | "MATERIAL" | "BOTH";
export type CreatedVia = "MANUAL" | "QUICK_ADD" | "IMPORT";

export interface BusinessPartner {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  roles: PartnerRole[];
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  supplierType?: SupplierType;
  isSystemOwner?: boolean;
  createdVia: CreatedVia;
  isActive: boolean;
}

export type MaterialType = "RESIN" | "METAL_COIL" | "SHEET" | "OTHER";

export interface Material {
  id: string;
  code: string;
  name: string;
  grade?: string;
  materialType: MaterialType;
  color?: string;
  sizeSpec?: string;
  additiveMasterbatch?: string;
  defaultUnit?: string;
  supplierCode?: string;
  isActive: boolean;
}

export interface Part {
  id: string;
  partNo: string;
  partName: string;
  model?: string;
  materialId: string;
  supplierCode?: string;
  customerCode?: string;
  defaultCavityCount: number;
  moldCode?: string;
  drawingRev?: string;
  isActive: boolean;
}

export type MachineType =
  | "INJECTION_HORIZONTAL"
  | "INJECTION_VERTICAL"
  | "PRESS"
  | "OTHER";

export interface Machine {
  id: string;
  machineNo: string;
  type: MachineType;
  tonnage?: number;
  plantCode: string;
  shiftTemplateCode?: string;
  isActive: boolean;
}

export type ChecksheetStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "CHECKED"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export type Judgment = "OK" | "NG" | null;

export interface Checksheet {
  id: string;
  number: string;
  formCode: string;
  formName: string;
  category: "INCOMING" | "IN_PROCESS";
  partNo: string;
  partName: string;
  supplierCode?: string;
  customerName?: string;
  machineNo?: string;
  lotNo: string;
  inspectionDate: string;
  status: ChecksheetStatus;
  finalJudgment: Judgment;
  inspectorName: string;
  checkedByName?: string;
  approvedByName?: string;
  totalItems: number;
  ngItems: number;
  /** Immutable header values captured when this checksheet was created. */
  headerSnapshot?: Record<string, string>;
  /** Captured inspection values, indexed using the corresponding template's item keys. */
  itemSnapshot?: Record<string, string>;
  /** Captured per-item/row remarks. */
  remarksSnapshot?: Record<string, string>;
}

export interface ShiftTemplate {
  id: string;
  code: string;
  name: string;
  shiftCount: number;
  slotDurationMinutes: number;
  totalHoursPerDay: number;
  isActive: boolean;
}

export interface Shift {
  id: string;
  templateCode: string;
  shiftNo: number;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  crossesMidnight: boolean;
  isNightShift: boolean;
}

export interface WorkSchedule {
  id: string;
  code: string;
  name: string;
  plantCode: string;
  shiftTemplateCode: string;
  effectiveFrom: string;
  effectiveTo: string;
  workDays: string[];
  holidays: string[];
  isActive: boolean;
}

export interface NumberingRule {
  id: string;
  docType: string;
  formatPattern: string;
  resetPeriod: "YEARLY" | "MONTHLY" | "DAILY" | "PER_SHIFT" | "NEVER";
  padding: number;
  nextValue: number;
  scope: "PER_PLANT" | "GLOBAL";
  isActive: boolean;
}
