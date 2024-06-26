import { Injectable, NotImplementedException } from '@nestjs/common';
import { SupportedChains } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';

import { PAGE_SIZES } from '@/constants';
import { CovalentService } from '@/modules/covalent/covalent.service';
import { NftCollectionWithTokens } from '@/modules/moralis/moralis.constants';
import { UnifiedNftNext } from '@/modules/unified-nft/unified-nft.types';
import { UnmarshalService } from '@/modules/unmarshal/unmarshal.service';
import { SupportedChainsList } from '@/modules/web3/web3.constants';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class UnifiedNftService {
	constructor(
		private covalentService: CovalentService,
		private unmarshalService: UnmarshalService,
	) {}

	async getNftsForAddress({
		chainOrChains = SupportedChainsList,
		walletAddress,
		nextChain,
		selectedNftIds,
		nextPage,
	}: {
		walletAddress: string;
		selectedNftIds: Set<string>;
		chainOrChains?: SupportedChains | SupportedChains[];
		nextChain?: SupportedChains;
		nextPage?: string;
	}): Promise<{
		nftCollections: NftCollectionWithTokens[];
		next: UnifiedNftNext;
	}> {
		const chains = Array.isArray(chainOrChains)
			? chainOrChains
			: [chainOrChains];
		let chainsAfterSkip = nextChain
			? chains.slice(chains.indexOf(nextChain))
			: chains;

		if (this.isSolanaAddress(walletAddress)) {
			chainsAfterSkip = [SupportedChains.SOLANA];
		} else {
			chainsAfterSkip = chainsAfterSkip.filter(
				(chain) => chain !== SupportedChains.SOLANA,
			);
		}

		const nftCollections: NftCollectionWithTokens[] = [];
		let next: UnifiedNftNext = null;

		for (const [index, chain] of chainsAfterSkip.entries()) {
			const collections = await this.getChainBasedNfts({
				chain,
				walletAddress,
				selectedNftIds,
				nextPage,
			});
			const nextChain = chainsAfterSkip[index + 1];

			if (collections.next) {
				next = {
					nextChain: chain,
					nextPage: collections.next,
				};
			} else if (nextChain) {
				next = { nextChain };
			} else {
				next = null;
			}

			nftCollections.push(...collections.nftCollections);
			if (nftCollections.length >= PAGE_SIZES.NFT_COLLECTIONS) {
				break;
			}
		}

		return {
			nftCollections,
			next,
		};
	}

	async getChainBasedNfts({
		chain,
		walletAddress,
		selectedNftIds,
		nextPage,
	}: {
		walletAddress: string;
		chain: SupportedChains;
		selectedNftIds: Set<string>;
		nextPage?: string;
	}): Promise<{
		nftCollections: NftCollectionWithTokens[];
		next?: string;
	}> {
		if (
			chain === SupportedChains.ETHEREUM ||
			chain === SupportedChains.POLYGON
		) {
			return this.covalentService.getNftsForAddress({
				chain,
				walletAddress,
				selectedNftIds,
			});
		} else if (
			chain === SupportedChains.SOLANA ||
			chain === SupportedChains.KLAYTN
		) {
			return this.unmarshalService.getNftsForAddress({
				chain,
				walletAddress,
				selectedNftIds,
				nextPage,
			});
		}

		throw new NotImplementedException(ErrorCodes.MISSING_IMPLEMENTATION);
	}

	isSolanaAddress(walletAddress: string) {
		try {
			new PublicKey(walletAddress);
			// return PublicKey.isOnCurve(address);
			return true;
		} catch (e) {
			return false;
		}
	}
}
