/*
  Warnings:

  - You are about to drop the column `walletId` on the `UserSelectedNft` table. All the data in the column will be lost.
  - Added the required column `walletAddress` to the `UserSelectedNft` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserSelectedNft" DROP CONSTRAINT "UserSelectedNft_walletId_fkey";

-- AlterTable
ALTER TABLE "UserSelectedNft" DROP COLUMN "walletId",
ADD COLUMN     "walletAddress" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "UserSelectedNft" ADD CONSTRAINT "UserSelectedNft_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "Wallet"("publicAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
