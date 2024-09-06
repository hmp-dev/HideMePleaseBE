-- CreateTable
CREATE TABLE "NftCollectionAllowedSpace" (
                                             "id" SERIAL NOT NULL,
                                             "NftCollectionTokenAddress" TEXT,
                                             "SpaceId" UUID,

                                             CONSTRAINT "NftCollectionAllowedSpace_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NftCollectionAllowedSpace" ADD CONSTRAINT "nftcollectionallowedspace_nftcollectiontokenaddress_foreign" FOREIGN KEY ("NftCollectionTokenAddress") REFERENCES "NftCollection"("tokenAddress") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NftCollectionAllowedSpace" ADD CONSTRAINT "nftcollectionallowedspace_spaceid_foreign" FOREIGN KEY ("SpaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE NO ACTION;