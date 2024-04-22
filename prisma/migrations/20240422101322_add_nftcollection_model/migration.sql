/*
  Warnings:

  - You are about to drop the `Nft` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Nft";

-- CreateTable
CREATE TABLE "NftCollection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "link" TEXT,
    "tokenAddress" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "collectionLogo" TEXT,
    "chain" "SupportedChains" NOT NULL,

    CONSTRAINT "NftCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NftCollection_tokenAddress_key" ON "NftCollection"("tokenAddress");

-- AddForeignKey
ALTER TABLE "UserSelectedNft" ADD CONSTRAINT "UserSelectedNft_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
