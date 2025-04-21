-- CreateTable
CREATE TABLE "SolanaGroups" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokenAddress" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "SolanaGroups_pkey" PRIMARY KEY ("id")
);
