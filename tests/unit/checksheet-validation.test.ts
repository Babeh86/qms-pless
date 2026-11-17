import { describe, expect, it } from "vitest";
import { checksheetCreateSchema, checksheetUpdateSchema } from "@/lib/validation/checksheet";

const validCreate = {
  formCode: "CS-01",
  formName: "Incoming Material Inspection",
  templateRevision: "2025-01",
  partNo: "PART-001",
  partName: "Sample Part",
  lotNo: "LOT-001",
  inspectionDate: "2026-11-17",
  headerSnapshot: { partNo: "PART-001", lotNo: "LOT-001" },
  itemSnapshot: { "flat:0:0": "OK" },
  totalItems: 1,
  ngItems: 0,
};

describe("checksheet snapshot validation", () => {
  it("accepts a complete supported template snapshot", () => {
    expect(checksheetCreateSchema.parse(validCreate)).toMatchObject(validCreate);
  });

  it("rejects unknown template codes", () => {
    expect(checksheetCreateSchema.safeParse({ ...validCreate, formCode: "CS-99" }).success).toBe(false);
  });

  it("rejects oversized snapshot payloads", () => {
    expect(
      checksheetCreateSchema.safeParse({
        ...validCreate,
        headerSnapshot: { data: "x".repeat(100_001) },
      }).success,
    ).toBe(false);
  });

  it("requires at least one field for a draft update", () => {
    expect(checksheetUpdateSchema.safeParse({}).success).toBe(false);
    expect(checksheetUpdateSchema.safeParse({ itemSnapshot: { "flat:0:0": "OK" } }).success).toBe(true);
  });
});
