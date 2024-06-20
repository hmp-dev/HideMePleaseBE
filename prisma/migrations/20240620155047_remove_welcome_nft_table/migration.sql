/*
  Warnings:

  - You are about to drop the `WelcomeNft` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WelcomeNft" DROP CONSTRAINT "WelcomeNft_imageId_fkey";

-- DropForeignKey
ALTER TABLE "WelcomeNft" DROP CONSTRAINT "WelcomeNft_userId_fkey";

-- DropTable
DROP TABLE "WelcomeNft";
