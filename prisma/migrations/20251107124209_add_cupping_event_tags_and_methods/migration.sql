-- CreateTable
CREATE TABLE "CuppingEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    CONSTRAINT "Participant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CuppingEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CuppingEventTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tag" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    CONSTRAINT "CuppingEventTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CuppingEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CuppingEventProcessingMethod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "method" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    CONSTRAINT "CuppingEventProcessingMethod_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CuppingEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "adjudicatedFinalScore" REAL,
    "cuppingEventId" INTEGER,
    CONSTRAINT "Sample_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sample" ("adjudicatedFinalScore", "blindCode", "farmName", "farmerId", "id", "processingMethod", "region", "variety") SELECT "adjudicatedFinalScore", "blindCode", "farmName", "farmerId", "id", "processingMethod", "region", "variety" FROM "Sample";
DROP TABLE "Sample";
ALTER TABLE "new_Sample" RENAME TO "Sample";
CREATE UNIQUE INDEX "Sample_blindCode_key" ON "Sample"("blindCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
