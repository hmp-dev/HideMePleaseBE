-- AlterTable
ALTER TABLE "NftCollection" ADD COLUMN     "chatChannelCreated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chatAccessToken" TEXT;
