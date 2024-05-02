/*
  Warnings:

  - Added the required column `ownedWalletAddress` to the `Nft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Nft" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ownedWalletAddress" TEXT NOT NULL,
ADD COLUMN     "selected" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Nft" ADD CONSTRAINT "Nft_ownedWalletAddress_fkey" FOREIGN KEY ("ownedWalletAddress") REFERENCES "Wallet"("publicAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
