-- Remove farm fields from Farmer table
ALTER TABLE "Farmer" DROP COLUMN IF EXISTS "farmName";
ALTER TABLE "Farmer" DROP COLUMN IF EXISTS "variety";
ALTER TABLE "Farmer" DROP COLUMN IF EXISTS "region";
ALTER TABLE "Farmer" DROP COLUMN IF EXISTS "processingMethod";
ALTER TABLE "Farmer" DROP COLUMN IF EXISTS "altitude";
ALTER TABLE "Farmer" DROP COLUMN IF EXISTS "moisture";

-- Create ReEvaluationRequest table
CREATE TABLE "ReEvaluationRequest" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "sampleId" INTEGER NOT NULL,
    "cuppingEventId" INTEGER NOT NULL,
    "headJudgeId" INTEGER NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "ReEvaluationRequest_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample" ("id") ON DELETE CASCADE,
    CONSTRAINT "ReEvaluationRequest_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE,
    CONSTRAINT "ReEvaluationRequest_headJudgeId_fkey" FOREIGN KEY ("headJudgeId") REFERENCES "HeadJudge" ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX "ReEvaluationRequest_sampleId_cuppingEventId_headJudgeId_key" ON "ReEvaluationRequest"("sampleId", "cuppingEventId", "headJudgeId");
