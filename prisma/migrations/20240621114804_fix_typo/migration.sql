/*
  Warnings:

  - You are about to drop the column `maxDistanceFromspace` on the `SystemConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SystemConfig" DROP COLUMN "maxDistanceFromspace",
ADD COLUMN     "maxDistanceFromSpace" INTEGER NOT NULL DEFAULT 100;
