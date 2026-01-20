/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[publicId]` on the table `Farmer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[publicId]` on the table `HeadJudge` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[publicId]` on the table `QGrader` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "publicId" TEXT;

-- AlterTable
ALTER TABLE "Farmer" ADD COLUMN "publicId" TEXT;

-- AlterTable
ALTER TABLE "HeadJudge" ADD COLUMN "publicId" TEXT;

-- AlterTable
ALTER TABLE "QGrader" ADD COLUMN "publicId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "headJudgeId" INTEGER,
    "qGraderId" INTEGER,
    "farmerId" INTEGER,
    CONSTRAINT "Participant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CuppingEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Participant_headJudgeId_fkey" FOREIGN KEY ("headJudgeId") REFERENCES "HeadJudge" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Participant_qGraderId_fkey" FOREIGN KEY ("qGraderId") REFERENCES "QGrader" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Participant_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Participant" ("eventId", "headJudgeId", "id", "qGraderId", "role") SELECT "eventId", "headJudgeId", "id", "qGraderId", "role" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Admin_publicId_key" ON "Admin"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_publicId_key" ON "Farmer"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "HeadJudge_publicId_key" ON "HeadJudge"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "QGrader_publicId_key" ON "QGrader"("publicId");
