-- AlterTable
ALTER TABLE "SystemNftCollection" ALTER COLUMN "lastMintedTokenId" SET DEFAULT 1,
ALTER COLUMN "lastMintedTokenId" DROP DEFAULT;
DROP SEQUENCE "SystemNftCollection_lastMintedTokenId_seq";
