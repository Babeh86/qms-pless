-- CreateEnum
CREATE TYPE "ChecksheetDecisionAction" AS ENUM ('SUBMIT', 'CHECK', 'APPROVE', 'REJECT', 'RETURN');

-- CreateTable
CREATE TABLE "checksheet_decisions" (
    "id" TEXT NOT NULL,
    "checksheetId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" "RoleCode" NOT NULL,
    "action" "ChecksheetDecisionAction" NOT NULL,
    "fromStatus" "ChecksheetStatus" NOT NULL,
    "toStatus" "ChecksheetStatus" NOT NULL,
    "comment" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checksheet_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checksheet_decisions_checksheetId_at_idx" ON "checksheet_decisions"("checksheetId", "at");

-- CreateIndex
CREATE INDEX "checksheet_decisions_actorId_at_idx" ON "checksheet_decisions"("actorId", "at");

-- AddForeignKey
ALTER TABLE "checksheet_decisions" ADD CONSTRAINT "checksheet_decisions_checksheetId_fkey" FOREIGN KEY ("checksheetId") REFERENCES "checksheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checksheet_decisions" ADD CONSTRAINT "checksheet_decisions_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
