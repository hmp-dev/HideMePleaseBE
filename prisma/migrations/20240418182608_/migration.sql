/*
  Warnings:

  - The values [SOLANA,KLAYTON] on the enum `SupportedChains` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SupportedChains_new" AS ENUM ('ETHEREUM', 'POLYGON', 'MUMBAI');
ALTER TABLE "Nft" ALTER COLUMN "chain" TYPE "SupportedChains_new" USING ("chain"::text::"SupportedChains_new");
ALTER TYPE "SupportedChains" RENAME TO "SupportedChains_old";
ALTER TYPE "SupportedChains_new" RENAME TO "SupportedChains";
DROP TYPE "SupportedChains_old";
COMMIT;
