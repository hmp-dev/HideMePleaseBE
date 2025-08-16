-- CreateTable
CREATE TABLE IF NOT EXISTS "SpaceCheckIn" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "groupId" UUID,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SpaceCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SpaceCheckInGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spaceId" UUID NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "bonusAwarded" BOOLEAN NOT NULL DEFAULT false,
    "bonusPoints" INTEGER NOT NULL DEFAULT 10,
    "requiredMembers" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "SpaceCheckInGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SpaceCheckIn_userId_spaceId_isActive_key" ON "SpaceCheckIn"("userId", "spaceId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SpaceCheckIn_spaceId_isActive_idx" ON "SpaceCheckIn"("spaceId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SpaceCheckIn_userId_isActive_idx" ON "SpaceCheckIn"("userId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SpaceCheckInGroup_spaceId_isCompleted_idx" ON "SpaceCheckInGroup"("spaceId", "isCompleted");

-- AddForeignKey
ALTER TABLE "SpaceCheckIn" ADD CONSTRAINT "SpaceCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceCheckIn" ADD CONSTRAINT "SpaceCheckIn_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceCheckIn" ADD CONSTRAINT "SpaceCheckIn_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SpaceCheckInGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceCheckInGroup" ADD CONSTRAINT "SpaceCheckInGroup_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;