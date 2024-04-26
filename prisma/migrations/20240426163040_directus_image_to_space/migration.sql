/*
  Warnings:

  - Changed the type of `imageId` on the `Space` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Space" DROP CONSTRAINT "Space_imageId_fkey";

-- AlterTable
ALTER TABLE "Space" DROP COLUMN "imageId",
ADD COLUMN     "imageId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "directus_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
