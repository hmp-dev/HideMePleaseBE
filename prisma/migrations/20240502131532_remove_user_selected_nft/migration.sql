/*
  Warnings:

  - You are about to drop the `UserSelectedNft` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserSelectedNft" DROP CONSTRAINT "UserSelectedNft_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "UserSelectedNft" DROP CONSTRAINT "UserSelectedNft_tokenAddress_tokenId_fkey";

-- DropForeignKey
ALTER TABLE "UserSelectedNft" DROP CONSTRAINT "UserSelectedNft_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSelectedNft" DROP CONSTRAINT "UserSelectedNft_walletAddress_fkey";

-- DropTable
DROP TABLE "UserSelectedNft";
