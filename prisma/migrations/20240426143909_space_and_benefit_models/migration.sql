/*
  Warnings:

  - Added the required column `businessHoursEnd` to the `Space` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessHoursStart` to the `Space` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Space` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SpaceCategory" AS ENUM ('PUB', 'CAFE', 'COWORKING', 'MUSIC', 'MEAL');

-- CreateEnum
CREATE TYPE "BenefitLevel" AS ENUM ('LEVEL1', 'LEVEL2', 'LEVEL3', 'LEVEL4', 'LEVEL5');

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "businessHoursEnd" TIME NOT NULL,
ADD COLUMN     "businessHoursStart" TIME NOT NULL,
ADD COLUMN     "category" "SpaceCategory" NOT NULL,
ADD COLUMN     "introduction" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "locationDescription" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "SpaceBenefit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "spaceId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT NOT NULL,
    "level" "BenefitLevel" NOT NULL DEFAULT 'LEVEL1',
    "singleUse" BOOLEAN NOT NULL DEFAULT false,
    "isRepresentative" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SpaceBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceBenefitUsage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "benefitId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 1,
    "nftCollectionId" UUID NOT NULL,

    CONSTRAINT "SpaceBenefitUsage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SpaceBenefit" ADD CONSTRAINT "SpaceBenefit_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceBenefitUsage" ADD CONSTRAINT "SpaceBenefitUsage_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "SpaceBenefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceBenefitUsage" ADD CONSTRAINT "SpaceBenefitUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceBenefitUsage" ADD CONSTRAINT "SpaceBenefitUsage_nftCollectionId_fkey" FOREIGN KEY ("nftCollectionId") REFERENCES "NftCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
