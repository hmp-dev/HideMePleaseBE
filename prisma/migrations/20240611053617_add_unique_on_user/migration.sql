/*
  Warnings:

  - A unique constraint covering the columns `[nickName]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "nickName" DROP NOT NULL,
ALTER COLUMN "nickName" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "User_nickName_key" ON "User"("nickName");
