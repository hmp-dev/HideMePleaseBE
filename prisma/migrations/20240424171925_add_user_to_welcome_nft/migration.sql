-- AlterTable
ALTER TABLE "WelcomeNft" ADD COLUMN     "userId" UUID;

-- AddForeignKey
ALTER TABLE "WelcomeNft" ADD CONSTRAINT "WelcomeNft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
