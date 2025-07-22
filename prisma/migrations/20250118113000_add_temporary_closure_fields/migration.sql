-- AlterTable
ALTER TABLE "Space" ADD COLUMN "isTemporarilyClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "temporaryClosureReason" TEXT,
ADD COLUMN "temporaryClosureEndDate" TIMESTAMP(3);