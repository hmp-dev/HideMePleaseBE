/*
  Warnings:

  - The values [WEMIX] on the enum `WalletProvider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WalletProvider_new" AS ENUM ('METAMASK', 'KLIP', 'PHANTOM', 'WALLET_CONNECT');
ALTER TABLE "Wallet" ALTER COLUMN "provider" TYPE "WalletProvider_new" USING ("provider"::text::"WalletProvider_new");
ALTER TYPE "WalletProvider" RENAME TO "WalletProvider_old";
ALTER TYPE "WalletProvider_new" RENAME TO "WalletProvider";
DROP TYPE "WalletProvider_old";
COMMIT;
