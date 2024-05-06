-- AlterTable
ALTER TABLE "NftCollection" ADD COLUMN     "communityRank" INTEGER,
ADD COLUMN     "pointFluctuation" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalMembers" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "totalPoints" INTEGER NOT NULL DEFAULT 0;
