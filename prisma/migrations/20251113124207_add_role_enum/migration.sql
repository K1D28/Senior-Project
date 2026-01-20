-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FARMER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "role", "supabaseId", "updatedAt") SELECT "createdAt", "email", "id", "role", "supabaseId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
