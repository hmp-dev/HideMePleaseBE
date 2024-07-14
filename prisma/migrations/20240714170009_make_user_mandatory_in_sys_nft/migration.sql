/*
  Warnings:

  - Added the required column `userId` to the `SystemNft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SystemNft" ADD COLUMN     "userId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "SystemNft" ADD CONSTRAINT "SystemNft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
