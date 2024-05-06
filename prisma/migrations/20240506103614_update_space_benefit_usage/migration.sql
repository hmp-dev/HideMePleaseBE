/*
  Warnings:

  - You are about to drop the column `nftCollectionId` on the `SpaceBenefitUsage` table. All the data in the column will be lost.
  - Added the required column `tokenAddress` to the `SpaceBenefitUsage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SpaceBenefitUsage" DROP CONSTRAINT "SpaceBenefitUsage_nftCollectionId_fkey";

-- AlterTable
ALTER TABLE "SpaceBenefitUsage" DROP COLUMN "nftCollectionId",
ADD COLUMN     "tokenAddress" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "SpaceBenefitUsage" ADD CONSTRAINT "SpaceBenefitUsage_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
