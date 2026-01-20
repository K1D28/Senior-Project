/*
  Warnings:

  - Added the required column `altitude` to the `Sample` table without a default value. This is not possible if the table is not empty.
  - Added the required column `moisture` to the `Sample` table without a default value. This is not possible if the table is not empty.

*/
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
    "altitude" REAL NOT NULL,
    "moisture" REAL NOT NULL,
    "adjudicatedFinalScore" REAL,
    "cuppingEventId" INTEGER,
    CONSTRAINT "Sample_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Sample" ("adjudicatedFinalScore", "blindCode", "cuppingEventId", "farmName", "farmerId", "id", "processingMethod", "region", "variety") SELECT "adjudicatedFinalScore", "blindCode", "cuppingEventId", "farmName", "farmerId", "id", "processingMethod", "region", "variety" FROM "Sample";
DROP TABLE "Sample";
ALTER TABLE "new_Sample" RENAME TO "Sample";
CREATE UNIQUE INDEX "Sample_blindCode_key" ON "Sample"("blindCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
