-- CreateEnum for PointTransactionType (if not exists)
DO $$ BEGIN
    CREATE TYPE "PointTransactionType" AS ENUM ('EARNED', 'SPENT', 'REFUND', 'ADJUSTMENT', 'LOCKED', 'UNLOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for PointSource (if not exists)
DO $$ BEGIN
    CREATE TYPE "PointSource" AS ENUM ('CHECK_IN', 'GROUP_BONUS', 'PURCHASE', 'REWARD', 'REFERRAL', 'EVENT', 'ADMIN_GRANT', 'ADMIN_DEDUCT', 'TRANSFER_IN', 'TRANSFER_OUT', 'REFUND', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable UserPointBalance
CREATE TABLE IF NOT EXISTS "UserPointBalance" (
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

-- CreateTable PointTransaction
CREATE TABLE IF NOT EXISTS "PointTransaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "PointTransactionType" NOT NULL,
    "source" "PointSource" NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- Add columns to Space table (if they don't exist)
ALTER TABLE "Space" 
ADD COLUMN IF NOT EXISTS "maxCheckInCapacity" INTEGER,
ADD COLUMN IF NOT EXISTS "checkInEnabled" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "checkInPointsOverride" INTEGER,
ADD COLUMN IF NOT EXISTS "dailyCheckInLimit" INTEGER,
ADD COLUMN IF NOT EXISTS "checkInRequirements" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserPointBalance_userId_key" ON "UserPointBalance"("userId");
CREATE INDEX IF NOT EXISTS "UserPointBalance_userId_idx" ON "UserPointBalance"("userId");
CREATE INDEX IF NOT EXISTS "PointTransaction_userId_createdAt_idx" ON "PointTransaction"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PointTransaction_source_idx" ON "PointTransaction"("source");
CREATE INDEX IF NOT EXISTS "PointTransaction_referenceId_referenceType_idx" ON "PointTransaction"("referenceId", "referenceType");

-- AddForeignKey
ALTER TABLE "UserPointBalance" ADD CONSTRAINT "UserPointBalance_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;