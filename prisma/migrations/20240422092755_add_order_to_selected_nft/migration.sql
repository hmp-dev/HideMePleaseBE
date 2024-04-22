/*
  Warnings:

  - Added the required column `order` to the `UserSelectedNft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSelectedNft" ADD COLUMN     "order" INTEGER NOT NULL;
