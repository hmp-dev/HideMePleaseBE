/*
  Warnings:

  - Added the required column `tokenFileId` to the `SystemNft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SystemNft" ADD COLUMN     "tokenFileId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "SystemNft" ADD CONSTRAINT "SystemNft_tokenFileId_fkey" FOREIGN KEY ("tokenFileId") REFERENCES "directus_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
