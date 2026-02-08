-- CreateTable
CREATE TABLE "QGraderScore" (
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
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QGraderScore_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QGraderScore_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QGraderScore_qGraderId_fkey" FOREIGN KEY ("qGraderId") REFERENCES "QGrader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "QGraderScore_sampleId_qGraderId_key" ON "QGraderScore"("sampleId", "qGraderId");
