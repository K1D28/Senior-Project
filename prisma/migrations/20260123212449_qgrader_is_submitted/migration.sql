-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QGraderScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sampleId" INTEGER NOT NULL,
    "cuppingEventId" INTEGER,
    "qGraderId" INTEGER NOT NULL,
    "fragrance" REAL NOT NULL,
    "flavor" REAL NOT NULL,
    "aftertaste" REAL NOT NULL,
    "acidity" REAL NOT NULL,
    "body" REAL NOT NULL,
    "balance" REAL NOT NULL,
    "uniformity" REAL NOT NULL,
    "cleanCup" REAL NOT NULL,
    "sweetness" REAL NOT NULL,
    "overall" REAL NOT NULL,
    "defects" INTEGER NOT NULL DEFAULT 0,
    "comments" TEXT,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" DATETIME,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QGraderScore_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QGraderScore_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QGraderScore_qGraderId_fkey" FOREIGN KEY ("qGraderId") REFERENCES "QGrader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_QGraderScore" ("acidity", "aftertaste", "balance", "body", "cleanCup", "comments", "createdAt", "cuppingEventId", "defects", "flavor", "fragrance", "id", "overall", "qGraderId", "sampleId", "sweetness", "total", "uniformity", "updatedAt") SELECT "acidity", "aftertaste", "balance", "body", "cleanCup", "comments", "createdAt", "cuppingEventId", "defects", "flavor", "fragrance", "id", "overall", "qGraderId", "sampleId", "sweetness", "total", "uniformity", "updatedAt" FROM "QGraderScore";
DROP TABLE "QGraderScore";
ALTER TABLE "new_QGraderScore" RENAME TO "QGraderScore";
CREATE UNIQUE INDEX "QGraderScore_sampleId_qGraderId_key" ON "QGraderScore"("sampleId", "qGraderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
