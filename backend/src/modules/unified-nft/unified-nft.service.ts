import { Injectable, NotImplementedException } from '@nestjs/common';
import { SupportedChains } from '@prisma/client';

import { PAGE_SIZES } from '@/constants';
import { CovalentService } from '@/modules/covalent/covalent.service';
import { NftCollectionWithTokens } from '@/modules/moralis/moralis.constants';
import { SimpleHashService } from '@/modules/simple-hash/simple-hash.service';
import { NftHardcoderService } from '@/modules/unified-nft/nft-hardcoder.service';
import { UnifiedNftNext } from '@/modules/unified-nft/unified-nft.types';
import { UnmarshalService } from '@/modules/unmarshal/unmarshal.service';
import { SupportedChainsList } from '@/modules/web3/web3.constants';
import { ErrorCodes } from '@/utils/errorCodes';

import { isSolanaAddress } from '../web3/web3.utils';

@Injectable()
export class UnifiedNftService {
	constructor(
		private covalentService: CovalentService,
		private unmarshalService: UnmarshalService,
		private simpleHashService: SimpleHashService,
		private nftHardcoderService: NftHardcoderService,
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

		if (isSolanaAddress(walletAddress)) {
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

			nftCollections.push(
				...this.nftHardcoderService.replaceHardcodedNfts(
					collections.nftCollections,
				),
			);
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
		if (chain === SupportedChains.KLAYTN) {
			return this.unmarshalService.getNftsForAddress({
				chain,
				walletAddress,
				selectedNftIds,
				nextPage,
			});
		} else if (
			chain === SupportedChains.ETHEREUM ||
			chain === SupportedChains.POLYGON ||
			chain === SupportedChains.SOLANA
		) {
			return this.simpleHashService.getNftsForAddress({
				chain,
				walletAddress,
				selectedNftIds,
				nextPage,
			});
		}

		throw new NotImplementedException(ErrorCodes.MISSING_IMPLEMENTATION);
	}

	async checkNftOwner({
		tokenAddress,
		tokenId,
		chain,
		walletAddress,
	}: {
		tokenAddress: string;
		chain: SupportedChains;
		tokenId: string;
		walletAddress: string;
	}): Promise<boolean> {
		if (
			chain === SupportedChains.ETHEREUM ||
			chain === SupportedChains.POLYGON
		) {
			return this.covalentService.checkNftOwner({
				chain,
				tokenAddress,
				tokenId,
				walletAddress,
			});
		} else if (
			chain === SupportedChains.SOLANA ||
			chain === SupportedChains.KLAYTN
		) {
			return this.unmarshalService.checkNftOwner({
				chain,
				tokenAddress,
				tokenId,
				walletAddress,
			});
		}

		throw new NotImplementedException(ErrorCodes.MISSING_IMPLEMENTATION);
	}
}
