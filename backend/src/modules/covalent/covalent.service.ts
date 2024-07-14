import { CovalentClient } from '@covalenthq/client-sdk';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupportedChains } from '@prisma/client';

import { getCompositeTokenId } from '@/api/nft/nft.utils';
import { NftCollectionWithTokens } from '@/modules/moralis/moralis.constants';
import { SupportedChainCovalentMapping } from '@/modules/web3/web3.constants';
import { PickKey } from '@/types';
import { EnvironmentVariables } from '@/utils/env';

type CovalentSupportedTypes = PickKey<
	typeof SupportedChains,
	'ETHEREUM' | 'POLYGON'
>;

@Injectable()
export class CovalentService implements OnModuleInit {
	private client!: CovalentClient;

	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
	) {}

	onModuleInit() {
		this.client = new CovalentClient(
			this.configService.get<string>('COVALENT_API_KEY'),
		);
	}

	async getNftsForAddress({
		chain,
		walletAddress,
		selectedNftIds,
	}: {
		walletAddress: string;
		chain: CovalentSupportedTypes;
		selectedNftIds: Set<string>;
	}): Promise<{
		nftCollections: NftCollectionWithTokens[];
	}> {
		const collections = await this.client.NftService.getNftsForAddress(
			SupportedChainCovalentMapping[chain],
			walletAddress,
			{ noSpam: true },
		);

		const nftCollections: NftCollectionWithTokens[] =
			collections.data.items.map((nftCollection) => {
				const [firstToken] = nftCollection.nft_data;

				return {
					chainSymbol: chain,
					walletAddress,
					symbol: nftCollection.contract_ticker_symbol,
					contractType: nftCollection.supports_erc[0],
					tokenAddress: nftCollection.contract_address,
					name:
						nftCollection.contract_name ||
						firstToken?.external_data?.name,
					collectionLogo: firstToken?.external_data?.image,
					tokens: nftCollection.nft_data.map((nft) => {
						const nftId = getCompositeTokenId(
							nftCollection.contract_address,
							nft.token_id?.toString() as string,
						);
						return {
							id: nftId,
							tokenId: nft.token_id?.toString() as string,
							name: nft.external_data?.name,
							imageUrl: nft.external_data?.image,
							selected: selectedNftIds.has(nftId),
							ownerWalletAddress: walletAddress,
						};
					}),
				};
			});

		return { nftCollections };
	}

	// async getNftsForAddress({
	// 	chainOrChains = SupportedChainsList,
	// 	walletAddress,
	// 	nextChain,
	// }: {
	// 	walletAddress: string;
	// 	chainOrChains?: SupportedChains | SupportedChains[];
	// 	nextChain?: SupportedChains;
	// }) {
	// 	const chains = Array.isArray(chainOrChains)
	// 		? chainOrChains
	// 		: [chainOrChains];
	// 	const chainsAfterSkip = nextChain
	// 		? chains.slice(chains.indexOf(nextChain))
	// 		: chains;
	//
	// 	const nftCollections: Array<
	// 		NftTokenContractBalanceItem & { chain: SupportedChains }
	// 	> = [];
	// 	let next: UnifiedNftNext = null;
	//
	// 	for (const [index, chain] of chainsAfterSkip.entries()) {
	// 		const collections = await this.client.NftService.getNftsForAddress(
	// 			SupportedChainCovalentMapping[chain],
	// 			walletAddress,
	// 		);
	//
	// 		const nextChain = chainsAfterSkip[index + 1];
	//
	// 		if (nextChain) {
	// 			next = { nextChain };
	// 		} else {
	// 			next = null;
	// 		}
	//
	// 		console.log(collections);
	//
	// 		nftCollections.push(
	// 			...collections.data.items.map((item) => ({ ...item, chain })),
	// 		);
	// 		if (nftCollections.length >= PAGE_SIZES.NFT_COLLECTIONS) {
	// 			break;
	// 		}
	// 	}
	//
	// 	return { nftCollections, next };
	// }

	async checkNftOwner({
		tokenAddress,
		chain,
		tokenId,
		walletAddress,
	}: {
		tokenAddress: string;
		chain: CovalentSupportedTypes;
		tokenId: string;
		walletAddress: string;
	}) {
		const res =
			await this.client.NftService.checkOwnershipInNftForSpecificTokenId(
				SupportedChainCovalentMapping[chain],
				walletAddress,
				tokenAddress,
				tokenId,
			);
		return !!res.data?.items?.length;
	}
}
