-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blindCode" TEXT,
    "farmName" TEXT NOT NULL,
    "farmerId" INTEGER,
    "region" TEXT,
    "variety" TEXT NOT NULL,
    "processingMethod" TEXT NOT NULL,
    "altitude" REAL NOT NULL,
    "moisture" REAL NOT NULL,
    "sampleType" TEXT NOT NULL DEFAULT 'FARMER_REGISTERED',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedByAdminId" INTEGER,
    "approvalDate" DATETIME,
    "approvalNotes" TEXT,
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
INSERT INTO "new_Sample" ("adjudicatedFinalScore", "adjudicationJustification", "altitude", "blindCode", "cuppingEventId", "farmName", "farmerId", "flaggedForDiscussion", "gradeLevel", "headJudgeNotes", "id", "isLocked", "lockedAt", "lockedByHeadJudgeId", "moisture", "processingMethod", "region", "sampleType", "variety") SELECT "adjudicatedFinalScore", "adjudicationJustification", "altitude", "blindCode", "cuppingEventId", "farmName", "farmerId", "flaggedForDiscussion", "gradeLevel", "headJudgeNotes", "id", "isLocked", "lockedAt", "lockedByHeadJudgeId", "moisture", "processingMethod", "region", "sampleType", "variety" FROM "Sample";
DROP TABLE "Sample";
ALTER TABLE "new_Sample" RENAME TO "Sample";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
