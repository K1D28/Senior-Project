-- CreateTable
CREATE TABLE "HeadJudgeDecision" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sampleId" INTEGER NOT NULL,
    "headJudgeId" INTEGER NOT NULL,
    "finalScore" REAL,
    "gradeLevel" TEXT,
    "notes" TEXT,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HeadJudgeDecision_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HeadJudgeDecision_headJudgeId_fkey" FOREIGN KEY ("headJudgeId") REFERENCES "HeadJudge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blindCode" TEXT NOT NULL,
    "farmName" TEXT NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "region" TEXT,
    "variety" TEXT NOT NULL,
    "processingMethod" TEXT NOT NULL,
    "altitude" REAL NOT NULL,
    "moisture" REAL NOT NULL,
    "adjudicatedFinalScore" REAL,
    "gradeLevel" TEXT,
    "headJudgeNotes" TEXT,
    "adjudicationJustification" TEXT,
    "flaggedForDiscussion" BOOLEAN,
    "cuppingEventId" INTEGER,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedByHeadJudgeId" INTEGER,
    "lockedAt" DATETIME,
    CONSTRAINT "Sample_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Sample" ("adjudicatedFinalScore", "altitude", "blindCode", "cuppingEventId", "farmName", "farmerId", "id", "moisture", "processingMethod", "region", "variety") SELECT "adjudicatedFinalScore", "altitude", "blindCode", "cuppingEventId", "farmName", "farmerId", "id", "moisture", "processingMethod", "region", "variety" FROM "Sample";
DROP TABLE "Sample";
ALTER TABLE "new_Sample" RENAME TO "Sample";
CREATE UNIQUE INDEX "Sample_blindCode_key" ON "Sample"("blindCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "HeadJudgeDecision_sampleId_headJudgeId_key" ON "HeadJudgeDecision"("sampleId", "headJudgeId");
