/*
  Warnings:

  - Added the required column `name` to the `SystemNft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SystemNft" ADD COLUMN     "name" TEXT NOT NULL;
