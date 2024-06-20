-- CreateTable
CREATE TABLE "SystemNft" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokenAddress" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "tokenUri" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,

    CONSTRAINT "SystemNft_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SystemNft" ADD CONSTRAINT "SystemNft_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "SystemNftCollection"("tokenAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
