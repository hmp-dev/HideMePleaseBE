-- AlterTable
ALTER TABLE "Space" ADD COLUMN "addressEn" TEXT;

-- AlterTable
ALTER TABLE "SpaceBusinessHours" ADD COLUMN "breakStartTime" TEXT,
ADD COLUMN "breakEndTime" TEXT;