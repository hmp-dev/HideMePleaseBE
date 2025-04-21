import { EvmNftCollection } from '@moralisweb3/common-evm-utils';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { SupportedChains } from '@prisma/client';

import { PAGE_SIZES } from '@/constants';
import { MoralisApiService } from '@/modules/moralis/moralis-api.service';
import {
	SupportedChainMapping,
	SupportedChainsList,
} from '@/modules/web3/web3.constants';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class MoralisNftService {
	constructor(private moralisApiService: MoralisApiService) {}

	// async getWalletNfts(
	// 	walletAddress: string,
	// 	chainOrChains:
	// 		| SupportedChains
	// 		| SupportedChains[] = SupportedChainsList,
	// ) {
	// 	const chains = Array.isArray(chainOrChains)
	// 		? chainOrChains
	// 		: [chainOrChains];
	//
	// 	const chainWiseNfts = await Promise.all(
	// 		chains.map((chain) =>
	// 			this.moralisApiService.getWalletNFTs({
	// 				address: walletAddress,
	// 				chain: SupportedChainMapping[chain].hex,
	// 			}),
	// 		),
	// 	);
	//
	// 	return chainWiseNfts.map((nft) => nft.result);
	// }

	async getWalletNFTCollections({
		walletAddress,
		chainOrChains = SupportedChainsList,
		cursor,
		cursorType,
		limit = PAGE_SIZES.NFT_COLLECTIONS,
	}: {
		walletAddress: string;
		chainOrChains?: SupportedChains | SupportedChains[];
		cursor?: string;
		cursorType?: SupportedChains;
		currentWalletAddress?: string;
		limit?: number;
	}) {
		const chains = Array.isArray(chainOrChains)
			? chainOrChains
			: [chainOrChains];
		const chainsAfterSkip = cursorType
			? chains.slice(chains.indexOf(cursorType))
			: chains;

		const nftCollections: EvmNftCollection[] = [];
		let next: {
			cursorType: SupportedChains;
			cursor?: string | null;
		} | null = null;

		for (const [index, chain] of chainsAfterSkip.entries()) {
			if (
				chain === SupportedChains.KLAYTN ||
				chain === SupportedChains.SOLANA
			) {
				throw new NotImplementedException(
					ErrorCodes.MISSING_IMPLEMENTATION,
				);
			}
			const collections =
				await this.moralisApiService.getWalletNFTCollections({
					address: walletAddress,
					chain: SupportedChainMapping[chain].hex,
					limit,
					cursor,
				});

			const nextChain = chainsAfterSkip[index + 1];

			if (collections.hasNext()) {
				next = { cursorType: chain, cursor: collections.raw.cursor };
			} else if (nextChain) {
				next = { cursorType: nextChain, cursor: null };
			} else {
				next = null;
			}

			nftCollections.push(...collections.result);
			if (nftCollections.length >= limit) {
				break;
			}
		}

		return { nftCollections, next };
	}
}
