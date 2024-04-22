/*
  Warnings:

  - You are about to drop the column `walletAddress` on the `UserSelectedNft` table. All the data in the column will be lost.
  - Added the required column `walletId` to the `UserSelectedNft` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserSelectedNft" DROP CONSTRAINT "UserSelectedNft_walletAddress_fkey";

-- AlterTable
ALTER TABLE "UserSelectedNft" DROP COLUMN "walletAddress",
ADD COLUMN     "walletId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "UserSelectedNft" ADD CONSTRAINT "UserSelectedNft_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
