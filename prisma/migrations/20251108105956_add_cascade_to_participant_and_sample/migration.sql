-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CuppingEventProcessingMethod" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "method" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    CONSTRAINT "CuppingEventProcessingMethod_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CuppingEventProcessingMethod" ("eventId", "id", "method") SELECT "eventId", "id", "method" FROM "CuppingEventProcessingMethod";
DROP TABLE "CuppingEventProcessingMethod";
ALTER TABLE "new_CuppingEventProcessingMethod" RENAME TO "CuppingEventProcessingMethod";
CREATE TABLE "new_CuppingEventTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tag" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    CONSTRAINT "CuppingEventTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CuppingEventTag" ("eventId", "id", "tag") SELECT "eventId", "id", "tag" FROM "CuppingEventTag";
DROP TABLE "CuppingEventTag";
ALTER TABLE "new_CuppingEventTag" RENAME TO "CuppingEventTag";
CREATE TABLE "new_Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    CONSTRAINT "Participant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Participant" ("eventId", "id", "role", "userId") SELECT "eventId", "id", "role", "userId" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
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
    CONSTRAINT "Sample_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Sample" ("adjudicatedFinalScore", "blindCode", "cuppingEventId", "farmName", "farmerId", "id", "processingMethod", "region", "variety") SELECT "adjudicatedFinalScore", "blindCode", "cuppingEventId", "farmName", "farmerId", "id", "processingMethod", "region", "variety" FROM "Sample";
DROP TABLE "Sample";
ALTER TABLE "new_Sample" RENAME TO "Sample";
CREATE UNIQUE INDEX "Sample_blindCode_key" ON "Sample"("blindCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
