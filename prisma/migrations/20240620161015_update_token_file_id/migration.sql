/*
  Warnings:

  - Changed the type of `tokenFileId` on the `SystemNft` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "SystemNft" DROP CONSTRAINT "SystemNft_tokenFileId_fkey";

-- AlterTable
ALTER TABLE "SystemNft" DROP COLUMN "tokenFileId",
ADD COLUMN     "tokenFileId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SystemNft" ADD CONSTRAINT "SystemNft_tokenFileId_fkey" FOREIGN KEY ("tokenFileId") REFERENCES "MediaFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
