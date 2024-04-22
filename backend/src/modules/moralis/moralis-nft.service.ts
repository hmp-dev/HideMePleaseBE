import { Injectable } from '@nestjs/common';
import { SupportedChains } from '@prisma/client';

import { MoralisApiService } from '@/modules/moralis/moralis-api.service';
import {
	SupportedChainMapping,
	SupportedChainsList,
} from '@/modules/web3/web3.constants';
import {
	EvmNftCollectionDataWithTokens,
	EvmNftCollectionDataWithWallet,
	PAGE_SIZES,
} from '@/modules/moralis/moralis.constants';
import { EvmNftCollection } from '@moralisweb3/common-evm-utils';

@Injectable()
export class MoralisNftService {
	constructor(private moralisApiService: MoralisApiService) {}

	async getWalletNfts(
		walletAddress: string,
		chainOrChains:
			| SupportedChains
			| SupportedChains[] = SupportedChainsList,
	) {
		const chains = Array.isArray(chainOrChains)
			? chainOrChains
			: [chainOrChains];

		const chainWiseNfts = await Promise.all(
			chains.map((chain) =>
				this.moralisApiService.getWalletNFTs({
					address: walletAddress,
					chain: SupportedChainMapping[chain].hex,
				}),
			),
		);

		return chainWiseNfts.map((nft) => nft.result);
	}

	async getWalletNFTCollections({
		walletAddress,
		chainOrChains = SupportedChainsList,
		cursor,
		cursorType,
	}: {
		walletAddress: string;
		chainOrChains: SupportedChains | SupportedChains[];
		cursor?: string;
		cursorType?: SupportedChains;
		currentWalletAddress?: string;
	}) {
		const chains = Array.isArray(chainOrChains)
			? chainOrChains
			: [chainOrChains];
		const chainsAfterSkip = cursorType
			? chains.slice(chains.indexOf(cursorType))
			: chains;

		const nftCollections: EvmNftCollection[] = [];
		let next: { type: SupportedChains; cursor?: string | null } | null =
			null;

		for (const [index, chain] of chainsAfterSkip.entries()) {
			const collections =
				await this.moralisApiService.getWalletNFTCollections({
					address: walletAddress,
					chain: SupportedChainMapping[chain].hex,
					limit: PAGE_SIZES.NFT_COLLECTIONS,
					cursor,
				});

			const nextChain = chainsAfterSkip[index + 1];

			if (collections.hasNext()) {
				next = { type: chain, cursor: collections.raw.cursor };
			} else if (nextChain) {
				next = { type: nextChain, cursor: null };
			} else {
				next = null;
			}

			nftCollections.push(...collections.result);
			if (nftCollections.length >= PAGE_SIZES.NFT_COLLECTIONS) {
				break;
			}
		}

		return { nftCollections, next };
	}

	async populateNftCollectionsWithTokens(
		nftCollections: EvmNftCollectionDataWithWallet[],
	): Promise<EvmNftCollectionDataWithTokens[]> {
		// TODO: Group by chain and pass token address as array for optimisation
		return Promise.all(
			nftCollections.map((nftCollection) =>
				this.populateNftCollectionWithTokens(nftCollection),
			),
		);
	}

	async populateNftCollectionWithTokens(
		nftCollection: EvmNftCollectionDataWithWallet,
	): Promise<EvmNftCollectionDataWithTokens> {
		const populatedCollection = await this.moralisApiService.getWalletNFTs({
			address: nftCollection.walletAddress,
			chain: nftCollection.chain,
			tokenAddresses: [nftCollection.tokenAddress],
			mediaItems: true,
			normalizeMetadata: true,
		});

		return { ...nftCollection, tokens: populatedCollection.result };
	}
}
