-- DropIndex
DROP INDEX "SpaceCheckIn_userId_spaceId_isActive_key";

-- CreateIndex  
CREATE INDEX "SpaceCheckIn_userId_spaceId_isActive_idx" ON "SpaceCheckIn"("userId", "spaceId", "isActive");