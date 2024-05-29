/*
  Warnings:

  - You are about to drop the column `verifierUserId` on the `SpaceBenefitUsage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SpaceBenefitUsage" DROP CONSTRAINT "SpaceBenefitUsage_verifierUserId_fkey";

-- AlterTable
ALTER TABLE "SpaceBenefitUsage" DROP COLUMN "verifierUserId";
