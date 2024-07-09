-- DropForeignKey
ALTER TABLE "Nft" DROP CONSTRAINT "Nft_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "NftCollectionMemberPoints" DROP CONSTRAINT "NftCollectionMemberPoints_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "NftCollectionMemberPoints" DROP CONSTRAINT "NftCollectionMemberPoints_userId_fkey";

-- DropForeignKey
ALTER TABLE "NftCollectionPoints" DROP CONSTRAINT "NftCollectionPoints_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleNotification" DROP CONSTRAINT "ScheduleNotification_userId_fkey";

-- DropForeignKey
ALTER TABLE "SpaceBenefitUsage" DROP CONSTRAINT "SpaceBenefitUsage_benefitId_fkey";

-- DropForeignKey
ALTER TABLE "SpaceBenefitUsage" DROP CONSTRAINT "SpaceBenefitUsage_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "SpaceBenefitUsage" DROP CONSTRAINT "SpaceBenefitUsage_userId_fkey";

-- DropForeignKey
ALTER TABLE "SpaceUser" DROP CONSTRAINT "SpaceUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "SystemNft" DROP CONSTRAINT "SystemNft_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "UserLastKnownSpace" DROP CONSTRAINT "UserLastKnownSpace_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "UserLastKnownSpace" DROP CONSTRAINT "UserLastKnownSpace_userId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- AddForeignKey
ALTER TABLE "SystemNft" ADD CONSTRAINT "SystemNft_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "SystemNftCollection"("tokenAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftCollectionPoints" ADD CONSTRAINT "NftCollectionPoints_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftCollectionMemberPoints" ADD CONSTRAINT "NftCollectionMemberPoints_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftCollectionMemberPoints" ADD CONSTRAINT "NftCollectionMemberPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nft" ADD CONSTRAINT "Nft_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SpaceUser" ADD CONSTRAINT "SpaceUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLastKnownSpace" ADD CONSTRAINT "UserLastKnownSpace_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLastKnownSpace" ADD CONSTRAINT "UserLastKnownSpace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceBenefitUsage" ADD CONSTRAINT "SpaceBenefitUsage_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "SpaceBenefit"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SpaceBenefitUsage" ADD CONSTRAINT "SpaceBenefitUsage_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SpaceBenefitUsage" ADD CONSTRAINT "SpaceBenefitUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleNotification" ADD CONSTRAINT "ScheduleNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
