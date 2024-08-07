/*
  Warnings:

  - A unique constraint covering the columns `[modalBannerImageId]` on the table `SystemConfig` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "modalBannerEndDate" TIMESTAMP(3),
ADD COLUMN     "modalBannerImageId" UUID,
ADD COLUMN     "modalBannerStartDate" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_modalBannerImageId_key" ON "SystemConfig"("modalBannerImageId");

-- AddForeignKey
ALTER TABLE "SystemConfig" ADD CONSTRAINT "SystemConfig_modalBannerImageId_fkey" FOREIGN KEY ("modalBannerImageId") REFERENCES "directus_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
