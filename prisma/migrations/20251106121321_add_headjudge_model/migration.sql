-- CreateTable
CREATE TABLE "HeadJudge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "HeadJudge_email_key" ON "HeadJudge"("email");
