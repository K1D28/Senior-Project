-- CreateTable
CREATE TABLE "CuppingEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "isResultsRevealed" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "CuppingEventTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tag" TEXT NOT NULL,
    "cuppingEventId" INTEGER NOT NULL,
    CONSTRAINT "CuppingEventTag_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CuppingEventQGrader" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "qGraderId" INTEGER NOT NULL,
    "cuppingEventId" INTEGER NOT NULL,
    CONSTRAINT "CuppingEventQGrader_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CuppingEventHeadJudge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "headJudgeId" INTEGER NOT NULL,
    "cuppingEventId" INTEGER NOT NULL,
    CONSTRAINT "CuppingEventHeadJudge_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blindCode" TEXT NOT NULL,
    "farmName" TEXT NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "processingMethod" TEXT NOT NULL,
    "adjudicatedFinalScore" REAL,
    "cuppingEventId" INTEGER NOT NULL,
    CONSTRAINT "Sample_cuppingEventId_fkey" FOREIGN KEY ("cuppingEventId") REFERENCES "CuppingEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CuppingEventTag_tag_cuppingEventId_key" ON "CuppingEventTag"("tag", "cuppingEventId");

-- CreateIndex
CREATE UNIQUE INDEX "CuppingEventQGrader_qGraderId_cuppingEventId_key" ON "CuppingEventQGrader"("qGraderId", "cuppingEventId");

-- CreateIndex
CREATE UNIQUE INDEX "CuppingEventHeadJudge_headJudgeId_cuppingEventId_key" ON "CuppingEventHeadJudge"("headJudgeId", "cuppingEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_blindCode_key" ON "Sample"("blindCode");

-- CreateIndex
CREATE INDEX "Sample_cuppingEventId_idx" ON "Sample"("cuppingEventId");
