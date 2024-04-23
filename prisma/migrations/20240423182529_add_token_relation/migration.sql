-- AddForeignKey
ALTER TABLE "UserSelectedNft" ADD CONSTRAINT "UserSelectedNft_tokenAddress_tokenId_fkey" FOREIGN KEY ("tokenAddress", "tokenId") REFERENCES "Nft"("tokenAddress", "tokenId") ON DELETE RESTRICT ON UPDATE CASCADE;
