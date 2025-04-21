-- CreateTable
CREATE TABLE "SystemNftCollection" (
    "tokenAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "contractType" TEXT NOT NULL DEFAULT 'KIP-17',
    "description" TEXT,
    "lastMintedTokenId" SERIAL NOT NULL,
    "maxMintedTokens" INTEGER NOT NULL DEFAULT 200,
    "addressUpdated" BOOLEAN NOT NULL DEFAULT false,
    "spaceId" UUID,
    "imageId" UUID NOT NULL,

    CONSTRAINT "SystemNftCollection_pkey" PRIMARY KEY ("tokenAddress")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemNftCollection_name_key" ON "SystemNftCollection"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SystemNftCollection_symbol_key" ON "SystemNftCollection"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "SystemNftCollection_alias_key" ON "SystemNftCollection"("alias");

-- AddForeignKey
ALTER TABLE "SystemNftCollection" ADD CONSTRAINT "SystemNftCollection_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SystemNftCollection" ADD CONSTRAINT "SystemNftCollection_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "directus_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
