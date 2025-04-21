export function getCompositeTokenId(
	tokenAddress: string,
	tokenId: string | number,
) {
	return `${tokenAddress}_${tokenId}`;
}

export function getNftKey(nftId: string) {
	return `NFT_TOKEN_${nftId}`;
}

// export function evmNftToNft(token: EvmNft): NftCreateWithCollection {
// 	return {
// 		id: getCompositeTokenId(token.tokenAddress.toJSON(), token.tokenId),
// 		name: token.name || '',
// 		imageUrl: token.media?.mediaCollection?.medium.url || '',
// 		tokenAddress: token.tokenAddress.toJSON(),
// 		tokenId: token.tokenId.toString(),
// 		tokenUpdatedAt: token.media?.updatedAt as Date,
// 		ownedWalletAddress: token.ownerOf?.toJSON() as unknown as string,
// 		lastOwnershipCheck: new Date(),
// 		contractType: token.contractType || '',
// 		symbol: token.symbol || '',
// 	};
// }
