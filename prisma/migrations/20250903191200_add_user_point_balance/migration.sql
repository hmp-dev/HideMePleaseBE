-- CreateTable
CREATE TABLE "UserPointBalance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "totalBalance" INTEGER NOT NULL DEFAULT 0,
    "availableBalance" INTEGER NOT NULL DEFAULT 0,
    "lockedBalance" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeSpent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserPointBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPointBalance_userId_key" ON "UserPointBalance"("userId");

-- CreateIndex
CREATE INDEX "UserPointBalance_userId_idx" ON "UserPointBalance"("userId");

-- AddForeignKey
ALTER TABLE "UserPointBalance" ADD CONSTRAINT "UserPointBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;