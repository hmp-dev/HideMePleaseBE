/*
  Warnings:

  - A unique constraint covering the columns `[tokenAddress,tokenId]` on the table `Nft` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Nft_tokenAddress_tokenId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Nft_tokenAddress_tokenId_key" ON "Nft"("tokenAddress", "tokenId");
