/*
  Warnings:

  - You are about to drop the column `publicId` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `publicId` on the `Farmer` table. All the data in the column will be lost.
  - You are about to drop the column `publicId` on the `HeadJudge` table. All the data in the column will be lost.
  - You are about to drop the column `publicId` on the `QGrader` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Admin" ("email", "id", "name", "password") SELECT "email", "id", "name", "password" FROM "Admin";
DROP TABLE "Admin";
ALTER TABLE "new_Admin" RENAME TO "Admin";
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
CREATE TABLE "new_Farmer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastLogin" DATETIME
);
INSERT INTO "new_Farmer" ("email", "id", "lastLogin", "name", "password", "status") SELECT "email", "id", "lastLogin", "name", "password", "status" FROM "Farmer";
DROP TABLE "Farmer";
ALTER TABLE "new_Farmer" RENAME TO "Farmer";
CREATE UNIQUE INDEX "Farmer_email_key" ON "Farmer"("email");
CREATE TABLE "new_HeadJudge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active'
);
INSERT INTO "new_HeadJudge" ("email", "id", "name", "password", "status") SELECT "email", "id", "name", "password", "status" FROM "HeadJudge";
DROP TABLE "HeadJudge";
ALTER TABLE "new_HeadJudge" RENAME TO "HeadJudge";
CREATE UNIQUE INDEX "HeadJudge_email_key" ON "HeadJudge"("email");
CREATE TABLE "new_QGrader" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastLogin" DATETIME
);
INSERT INTO "new_QGrader" ("email", "id", "lastLogin", "name", "password", "status") SELECT "email", "id", "lastLogin", "name", "password", "status" FROM "QGrader";
DROP TABLE "QGrader";
ALTER TABLE "new_QGrader" RENAME TO "QGrader";
CREATE UNIQUE INDEX "QGrader_email_key" ON "QGrader"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
