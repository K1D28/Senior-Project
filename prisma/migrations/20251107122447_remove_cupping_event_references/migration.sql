/*
  Warnings:

  - You are about to drop the `CuppingEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CuppingEventHeadJudge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CuppingEventQGrader` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CuppingEventTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `cuppingEventId` on the `Sample` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CuppingEventHeadJudge_headJudgeId_cuppingEventId_key";

-- DropIndex
DROP INDEX "CuppingEventQGrader_qGraderId_cuppingEventId_key";

-- DropIndex
DROP INDEX "CuppingEventTag_tag_cuppingEventId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CuppingEvent";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CuppingEventHeadJudge";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CuppingEventQGrader";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CuppingEventTag";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blindCode" TEXT NOT NULL,
    "farmName" TEXT NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "processingMethod" TEXT NOT NULL,
    "adjudicatedFinalScore" REAL
);
INSERT INTO "new_Sample" ("adjudicatedFinalScore", "blindCode", "farmName", "farmerId", "id", "processingMethod", "region", "variety") SELECT "adjudicatedFinalScore", "blindCode", "farmName", "farmerId", "id", "processingMethod", "region", "variety" FROM "Sample";
DROP TABLE "Sample";
ALTER TABLE "new_Sample" RENAME TO "Sample";
CREATE UNIQUE INDEX "Sample_blindCode_key" ON "Sample"("blindCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
