-- DropForeignKey  
ALTER TABLE "Nft" DROP CONSTRAINT "Nft_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "SpaceBenefitUsage" DROP CONSTRAINT "SpaceBenefitUsage_benefitId_fkey";

-- DropForeignKey
ALTER TABLE "SpaceBenefitUsage" DROP CONSTRAINT "SpaceBenefitUsage_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "SpaceBenefitUsage" DROP CONSTRAINT "SpaceBenefitUsage_userId_fkey";

-- AddForeignKey
ALTER TABLE "Nft" ADD CONSTRAINT "Nft_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SpaceBenefitUsage" ADD CONSTRAINT "SpaceBenefitUsage_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "SpaceBenefit"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SpaceBenefitUsage" ADD CONSTRAINT "SpaceBenefitUsage_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SpaceBenefitUsage" ADD CONSTRAINT "SpaceBenefitUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;