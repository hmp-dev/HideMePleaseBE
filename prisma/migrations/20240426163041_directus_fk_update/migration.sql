-- DropForeignKey
ALTER TABLE "SpaceBenefit" DROP CONSTRAINT "SpaceBenefit_spaceId_fkey";

-- AddForeignKey
ALTER TABLE "SpaceBenefit" ADD CONSTRAINT "SpaceBenefit_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
