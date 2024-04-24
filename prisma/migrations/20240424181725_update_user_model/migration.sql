-- AlterTable
ALTER TABLE "User" ADD COLUMN     "introduction" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "locationPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nickName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pfpNftId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pfpNftId_fkey" FOREIGN KEY ("pfpNftId") REFERENCES "Nft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
