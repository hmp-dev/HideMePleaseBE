/*
  Warnings:

  - You are about to drop the `UserLastKnownLocation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserLastKnownLocation" DROP CONSTRAINT "UserLastKnownLocation_userId_fkey";

-- DropTable
DROP TABLE "UserLastKnownLocation";
