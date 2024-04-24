/*
  Warnings:

  - You are about to drop the `WelcomeNftConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WelcomeNftConfig" DROP CONSTRAINT "WelcomeNftConfig_imageId_fkey";

-- DropTable
DROP TABLE "WelcomeNftConfig";

-- CreateTable
CREATE TABLE "WelcomeNft" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siteLink" TEXT NOT NULL,
    "imageId" INTEGER NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WelcomeNft_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WelcomeNft" ADD CONSTRAINT "WelcomeNft_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "MediaFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
