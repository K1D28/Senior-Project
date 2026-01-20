-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HeadJudge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active'
);
INSERT INTO "new_HeadJudge" ("email", "id", "name", "password") SELECT "email", "id", "name", "password" FROM "HeadJudge";
DROP TABLE "HeadJudge";
ALTER TABLE "new_HeadJudge" RENAME TO "HeadJudge";
CREATE UNIQUE INDEX "HeadJudge_email_key" ON "HeadJudge"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
