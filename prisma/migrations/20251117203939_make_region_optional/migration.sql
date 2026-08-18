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
    "cuppingEventId" INTEGER,
    CONSTRAINT "Sample_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Sample" ("adjudicatedFinalScore", "altitude", "blindCode", "cuppingEventId", "farmName", "farmerId", "id", "moisture", "processingMethod", "region", "variety") SELECT "adjudicatedFinalScore", "altitude", "blindCode", "cuppingEventId", "farmName", "farmerId", "id", "moisture", "processingMethod", "region", "variety" FROM "Sample";
DROP TABLE "Sample";
ALTER TABLE "new_Sample" RENAME TO "Sample";
CREATE UNIQUE INDEX "Sample_blindCode_key" ON "Sample"("blindCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
