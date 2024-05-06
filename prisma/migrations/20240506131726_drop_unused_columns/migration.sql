/*
  Warnings:

  - You are about to drop the column `communityRank` on the `NftCollection` table. All the data in the column will be lost.
  - You are about to drop the column `pointFluctuation` on the `NftCollection` table. All the data in the column will be lost.
  - You are about to drop the column `totalMembers` on the `NftCollection` table. All the data in the column will be lost.
  - You are about to drop the column `totalPoints` on the `NftCollection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NftCollection" DROP COLUMN "communityRank",
DROP COLUMN "pointFluctuation",
DROP COLUMN "totalMembers",
DROP COLUMN "totalPoints";
