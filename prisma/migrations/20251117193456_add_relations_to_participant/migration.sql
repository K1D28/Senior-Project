-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "headJudgeId" INTEGER,
    "qGraderId" INTEGER,
    CONSTRAINT "Participant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Participant_headJudgeId_fkey" FOREIGN KEY ("headJudgeId") REFERENCES "HeadJudge" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Participant_qGraderId_fkey" FOREIGN KEY ("qGraderId") REFERENCES "QGrader" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Participant" ("eventId", "id", "role") SELECT "eventId", "id", "role" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
