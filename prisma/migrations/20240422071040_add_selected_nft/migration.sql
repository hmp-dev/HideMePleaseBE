-- CreateTable
CREATE TABLE "UserSelectedNft" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "tokenId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "UserSelectedNft_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserSelectedNft" ADD CONSTRAINT "UserSelectedNft_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSelectedNft" ADD CONSTRAINT "UserSelectedNft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
