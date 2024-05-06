-- CreateTable
CREATE TABLE "NftCollectionPoints" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalPoints" INTEGER NOT NULL,
    "communityRank" INTEGER NOT NULL,
    "totalMembers" INTEGER NOT NULL,
    "pointFluctuation" INTEGER NOT NULL DEFAULT 0,
    "tokenAddress" TEXT NOT NULL,

    CONSTRAINT "NftCollectionPoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NftCollectionPoints_tokenAddress_key" ON "NftCollectionPoints"("tokenAddress");

-- AddForeignKey
ALTER TABLE "NftCollectionPoints" ADD CONSTRAINT "NftCollectionPoints_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
