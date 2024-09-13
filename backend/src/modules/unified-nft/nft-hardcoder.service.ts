import { Injectable } from '@nestjs/common';

import { NftCollectionWithTokens } from '@/modules/moralis/moralis.constants';

const HIDE_ME_PLEASE_COLLECTION_ID = 'c149a433bf01b20aef23f969b1922246';
const CALM_MIND_TOKEN_ID =
	'13160607876627315997298998607605372076388631947155285122643479581240930074649';
const RELAXED_MIND_TOKEN_ID =
	'13160607876627315997298998607605372076388631947155285122643479596634092863513';
const FICTIONAL_CALM_MIND_TOKEN_ADDRESS = 'fictional_token_calm_mind';
const FICTIONAL_RELAXED_MIND_TOKEN_ADDRESS = 'fictional_token_relaxed_mind';

@Injectable()
export class NftHardcoderService {
	replaceHardcodedNfts(
		nftCollections: NftCollectionWithTokens[],
	): NftCollectionWithTokens[] {
		const hideMeCollection = nftCollections.find(
			(nftCollection) =>
				nftCollection.tokenAddress === HIDE_ME_PLEASE_COLLECTION_ID,
		);

		if (!hideMeCollection) {
			return nftCollections;
		}

		const filteredCollections = nftCollections.filter(
			(nftCollection) =>
				nftCollection.tokenAddress !== HIDE_ME_PLEASE_COLLECTION_ID,
		);

		const calmMindNft = hideMeCollection.tokens.find(
			(token) => token.tokenId === CALM_MIND_TOKEN_ID,
		);
		if (calmMindNft) {
			filteredCollections.unshift({
				tokens: [calmMindNft],
				chainSymbol: 'ETHEREUM',
				name: 'Calm Mind',
				tokenAddress: FICTIONAL_CALM_MIND_TOKEN_ADDRESS,
				walletAddress: calmMindNft.ownerWalletAddress,
				collectionLogo: calmMindNft.imageUrl,
			});
		}

		const relaxedMindNft = hideMeCollection.tokens.find(
			(token) => token.tokenId === RELAXED_MIND_TOKEN_ID,
		);
		if (relaxedMindNft) {
			filteredCollections.unshift({
				tokens: [relaxedMindNft],
				chainSymbol: 'ETHEREUM',
				name: 'Relaxed Mind',
				tokenAddress: FICTIONAL_RELAXED_MIND_TOKEN_ADDRESS,
				walletAddress: relaxedMindNft.ownerWalletAddress,
				collectionLogo: relaxedMindNft.imageUrl,
			});
		}

		return filteredCollections;
	}
}
