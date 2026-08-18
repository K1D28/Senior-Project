/*
  Warnings:

  - You are about to drop the column `isDraft` on the `CuppingEvent` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CuppingEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "isResultsRevealed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CuppingEvent" ("id","name","date","description","isResultsRevealed","createdAt","updatedAt") SELECT "id","name","date","description","is","createdAt","updatedAt" FROM "CuppingEvent";
DROP TABLE "CuppingEvent";
ALTER TABLE "new_CuppingEvent" RENAME TO "CuppingEvent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
