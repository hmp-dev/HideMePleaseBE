-- CreateTable
CREATE TABLE "SystemNftCollectionSpace" (
                                            "id" SERIAL NOT NULL,
                                            "SystemNftCollectionTokenAddress" TEXT,
                                            "SpaceId" UUID,

                                            CONSTRAINT "SystemNftCollectionSpace_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SystemNftCollectionSpace" ADD CONSTRAINT "systemnftcollectionspace_spaceid_foreign" FOREIGN KEY ("SpaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SystemNftCollectionSpace" ADD CONSTRAINT "systemnftcollectionspace_systemnftcollectio__7fdec97_foreign" FOREIGN KEY ("SystemNftCollectionTokenAddress") REFERENCES "SystemNftCollection"("tokenAddress") ON DELETE CASCADE ON UPDATE NO ACTION;

