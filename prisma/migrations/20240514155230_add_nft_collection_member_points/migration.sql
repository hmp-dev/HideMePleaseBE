-- CreateTable
CREATE TABLE "NftCollectionMemberPoints" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalPoints" INTEGER NOT NULL,
    "memberRank" INTEGER NOT NULL,
    "pointFluctuation" INTEGER NOT NULL DEFAULT 0,
    "tokenAddress" TEXT NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "NftCollectionMemberPoints_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NftCollectionMemberPoints" ADD CONSTRAINT "NftCollectionMemberPoints_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftCollectionMemberPoints" ADD CONSTRAINT "NftCollectionMemberPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
