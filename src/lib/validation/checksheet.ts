import { z } from "zod";
import { TEMPLATE_REGISTRY } from "@/lib/mock/templates";

/**
 * Boundary validation for persisted check sheet snapshots.
 * Snapshots are capped so a draft cannot become an unbounded JSON payload.
 */

const MAX_SNAPSHOT_BYTES = 100_000;
const TEMPLATE_CODES = new Set(TEMPLATE_REGISTRY.map((entry) => entry.code));

const headerSnapshot = z
  .record(z.string().min(1).max(120), z.string().max(2_000))
  .refine((value) => JSON.stringify(value).length <= MAX_SNAPSHOT_BYTES, {
    message: "Header snapshot terlalu besar",
  });

const itemSnapshot = z
  .record(z.string().min(1).max(160), z.string().max(2_000))
  .refine((value) => JSON.stringify(value).length <= MAX_SNAPSHOT_BYTES, {
    message: "Item snapshot terlalu besar",
  });

const remarksSnapshot = z
  .record(z.string().min(1).max(160), z.string().max(2_000))
  .refine((value) => JSON.stringify(value).length <= MAX_SNAPSHOT_BYTES, {
    message: "Remarks snapshot terlalu besar",
  });

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus berformat YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), "Tanggal tidak valid");

const templateCode = z.string().refine((value) => TEMPLATE_CODES.has(value), {
  message: "Kode template tidak dikenal",
});

export const checksheetCreateSchema = z.object({
  formCode: templateCode,
  formName: z.string().trim().min(1).max(160),
  templateRevision: z.string().trim().min(1).max(40),
  partNo: z.string().trim().min(1).max(80),
  partName: z.string().trim().min(1).max(160),
  supplierSnapshot: z.string().trim().max(160).optional(),
  customerSnapshot: z.string().trim().max(160).optional(),
  lotNo: z.string().trim().min(1).max(80),
  inspectionDate: dateOnly,
  headerSnapshot,
  itemSnapshot,
  remarksSnapshot: remarksSnapshot.optional(),
  totalItems: z.number().int().min(0).max(10_000),
  ngItems: z.number().int().min(0).max(10_000),
  finalJudgment: z.enum(["OK", "NG"]).nullable().optional(),
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
});

export const checksheetUpdateSchema = z
  .object({
    headerSnapshot: headerSnapshot.optional(),
    itemSnapshot: itemSnapshot.optional(),
    remarksSnapshot: remarksSnapshot.optional(),
    totalItems: z.number().int().min(0).max(10_000).optional(),
    ngItems: z.number().int().min(0).max(10_000).optional(),
    finalJudgment: z.enum(["OK", "NG"]).nullable().optional(),
    inspectionDate: dateOnly.optional(),
    lotNo: z.string().trim().min(1).max(80).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Minimal satu field harus diubah",
  });

export const checksheetListQuerySchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED", "CHECKED", "APPROVED", "REJECTED", "ARCHIVED"]).optional(),
  formCode: templateCode.optional(),
  page: z.coerce.number().int().min(1).max(1_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type ChecksheetCreateInput = z.infer<typeof checksheetCreateSchema>;
export type ChecksheetUpdateInput = z.infer<typeof checksheetUpdateSchema>;
export type ChecksheetListQuery = z.infer<typeof checksheetListQuerySchema>;

export const checksheetTransitionSchema = z.object({
  action: z.enum(["SUBMIT", "CHECK", "APPROVE", "REJECT", "RETURN"]),
  comment: z.string().trim().max(2_000).optional(),
});

export type ChecksheetTransitionInput = z.infer<typeof checksheetTransitionSchema>;
