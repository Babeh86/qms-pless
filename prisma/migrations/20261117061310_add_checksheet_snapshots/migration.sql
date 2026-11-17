-- CreateEnum
CREATE TYPE "ChecksheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CHECKED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChecksheetJudgment" AS ENUM ('OK', 'NG');

-- CreateTable
CREATE TABLE "checksheets" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "formCode" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "templateRevision" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "checkedById" TEXT,
    "approvedById" TEXT,
    "partNoSnapshot" TEXT NOT NULL,
    "partNameSnapshot" TEXT NOT NULL,
    "supplierSnapshot" TEXT,
    "customerSnapshot" TEXT,
    "lotNoSnapshot" TEXT NOT NULL,
    "inspectionDate" DATE NOT NULL,
    "headerSnapshot" JSONB NOT NULL,
    "itemSnapshot" JSONB NOT NULL,
    "remarksSnapshot" JSONB,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "ngItems" INTEGER NOT NULL DEFAULT 0,
    "finalJudgment" "ChecksheetJudgment",
    "status" "ChecksheetStatus" NOT NULL DEFAULT 'DRAFT',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "checkedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "checksheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checksheet_attachments" (
    "id" TEXT NOT NULL,
    "checksheetId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checksheet_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checksheets_number_key" ON "checksheets"("number");

-- CreateIndex
CREATE INDEX "checksheets_plantId_status_inspectionDate_idx" ON "checksheets"("plantId", "status", "inspectionDate");

-- CreateIndex
CREATE INDEX "checksheets_createdById_createdAt_idx" ON "checksheets"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "checksheets_formCode_inspectionDate_idx" ON "checksheets"("formCode", "inspectionDate");

-- CreateIndex
CREATE UNIQUE INDEX "checksheets_createdById_idempotencyKey_key" ON "checksheets"("createdById", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "checksheet_attachments_objectKey_key" ON "checksheet_attachments"("objectKey");

-- CreateIndex
CREATE INDEX "checksheet_attachments_checksheetId_createdAt_idx" ON "checksheet_attachments"("checksheetId", "createdAt");

-- AddForeignKey
ALTER TABLE "checksheets" ADD CONSTRAINT "checksheets_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checksheets" ADD CONSTRAINT "checksheets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checksheets" ADD CONSTRAINT "checksheets_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checksheets" ADD CONSTRAINT "checksheets_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checksheet_attachments" ADD CONSTRAINT "checksheet_attachments_checksheetId_fkey" FOREIGN KEY ("checksheetId") REFERENCES "checksheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checksheet_attachments" ADD CONSTRAINT "checksheet_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
