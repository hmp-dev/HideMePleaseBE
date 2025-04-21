-- CreateEnum
CREATE TYPE "LoginType" AS ENUM ('FIREBASE', 'WORLD_ID');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loginType" "LoginType";
