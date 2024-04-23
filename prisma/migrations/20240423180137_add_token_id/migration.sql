/*
  Warnings:

  - Added the required column `tokenId` to the `Nft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Nft" ADD COLUMN     "tokenId" TEXT NOT NULL;
