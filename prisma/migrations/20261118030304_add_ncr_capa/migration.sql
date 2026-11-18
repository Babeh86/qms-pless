-- CreateEnum
CREATE TYPE "NcrStatus" AS ENUM ('OPEN', 'CONTAINED', 'IN_ACTION', 'VERIFIED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NcrSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NcrAction" AS ENUM ('CONTAIN', 'PLAN_ACTION', 'VERIFY', 'CLOSE', 'REOPEN', 'CANCEL');

-- CreateTable
CREATE TABLE "ncrs" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "checksheetId" TEXT,
    "checksheetItemKey" TEXT,
    "partNo" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "lotNo" TEXT NOT NULL,
    "defectType" TEXT NOT NULL,
    "defectLocation" TEXT,
    "severity" "NcrSeverity" NOT NULL DEFAULT 'MINOR',
    "description" TEXT NOT NULL,
    "containment" TEXT,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "preventiveAction" TEXT,
    "verification" TEXT,
    "picName" TEXT,
    "targetDate" DATE,
    "status" "NcrStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ncrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ncr_events" (
    "id" TEXT NOT NULL,
    "ncrId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" "RoleCode" NOT NULL,
    "action" "NcrAction" NOT NULL,
    "fromStatus" "NcrStatus" NOT NULL,
    "toStatus" "NcrStatus" NOT NULL,
    "note" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ncr_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ncrs_number_key" ON "ncrs"("number");

-- CreateIndex
CREATE INDEX "ncrs_plantId_status_createdAt_idx" ON "ncrs"("plantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ncrs_checksheetId_idx" ON "ncrs"("checksheetId");

-- CreateIndex
CREATE INDEX "ncrs_severity_status_idx" ON "ncrs"("severity", "status");

-- CreateIndex
CREATE INDEX "ncr_events_ncrId_at_idx" ON "ncr_events"("ncrId", "at");

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_checksheetId_fkey" FOREIGN KEY ("checksheetId") REFERENCES "checksheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncr_events" ADD CONSTRAINT "ncr_events_ncrId_fkey" FOREIGN KEY ("ncrId") REFERENCES "ncrs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncr_events" ADD CONSTRAINT "ncr_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
