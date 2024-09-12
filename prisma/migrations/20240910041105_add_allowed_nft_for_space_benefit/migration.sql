-- CreateTable
CREATE TABLE "SpaceBenefitNftCollection" (
                                             "id" SERIAL NOT NULL,
                                             "SpaceBenefitId" UUID,
                                             "NftCollectionTokenAddress" TEXT,

                                             CONSTRAINT "SpaceBenefitNftCollection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SpaceBenefitNftCollection" ADD CONSTRAINT "spacebenefitnftcollection_nftcollectiontokenaddress_foreign" FOREIGN KEY ("NftCollectionTokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SpaceBenefitNftCollection" ADD CONSTRAINT "spacebenefitnftcollection_spacebenefitid_foreign" FOREIGN KEY ("SpaceBenefitId") REFERENCES "SpaceBenefit"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
