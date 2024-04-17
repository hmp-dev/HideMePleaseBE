-- CreateEnum
CREATE TYPE "SupportedChains" AS ENUM ('ETHEREUM');

-- CreateEnum
CREATE TYPE "WalletProvider" AS ENUM ('METAMASK');

-- CreateTable
CREATE TABLE "Nft" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "collectionLogo" TEXT NOT NULL,
    "chain" "SupportedChains" NOT NULL,

    CONSTRAINT "Nft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "userId" UUID NOT NULL,
    "publicAddress" TEXT NOT NULL,
    "provider" "WalletProvider" NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Nft_symbol_chain_idx" ON "Nft"("symbol", "chain");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
