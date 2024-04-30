/*
  Warnings:

  - Added the required column `verifierUserId` to the `SpaceBenefitUsage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpaceBenefitUsage" ADD COLUMN     "verifierUserId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "SpaceBenefitUsage" ADD CONSTRAINT "SpaceBenefitUsage_verifierUserId_fkey" FOREIGN KEY ("verifierUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
