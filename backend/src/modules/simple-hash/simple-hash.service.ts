import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupportedChains } from '@prisma/client';
import axios, { Axios } from 'axios';

import { getCompositeTokenId } from '@/api/nft/nft.utils';
import { HeliusService } from '@/modules/helius/helius.service';
import { NftCollectionWithTokens } from '@/modules/moralis/moralis.constants';
import { SimpleHashNftForAddressResponse } from '@/modules/simple-hash/simple-hash.types';
import { PickKey } from '@/types';
import { EnvironmentVariables } from '@/utils/env';

type SimpleHashSupportedTypes = PickKey<typeof SupportedChains, 'SOLANA'>;

@Injectable()
export class SimpleHashService {
	private client: Axios;

	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
		private heliusService: HeliusService,
	) {
		this.client = new Axios({
			...axios.defaults,
			baseURL: `https://api.simplehash.com/api`,
			headers: {
				'X-API-KEY':
					this.configService.get<string>('SIMPLEHASH_API_KEY'),
			},
		});
	}

	async getNftsForAddress({
		chain,
		walletAddress,
		nextPage,
		selectedNftIds,
	}: {
		walletAddress: string;
		chain: SimpleHashSupportedTypes;
		selectedNftIds: Set<string>;
		nextPage?: string;
	}): Promise<{
		nftCollections: NftCollectionWithTokens[];
		next?: string;
	}> {
		const nftCollections: NftCollectionWithTokens[] = [];

		const response = await this.client.get<SimpleHashNftForAddressResponse>(
			`v0/nfts/owners?chains=solana&wallet_addresses=${walletAddress}&limit=50&cursor=${nextPage ? nextPage : undefined}`,
		);

		const next = response.data.next_cursor
			? response.data.next_cursor
			: undefined;

		const collectionsMap: Record<string, NftCollectionWithTokens> = {};

		if (!response.data.nfts) {
			return {
				nftCollections,
			};
		}

		for (const item of response.data.nfts) {
			if (!collectionsMap[item.contract_address]) {
				collectionsMap[item.contract_address] = {
					tokens: [],
					chainSymbol: chain,
					name: item.collection?.name
						? item.collection.name
						: (item.name || '')
								.replace(/[0-9]/g, '')
								.replaceAll('#', '')
								.trim(),
					tokenAddress:
						item.collection.collection_id || item.contract_address,
					walletAddress: walletAddress,
					collectionLogo: item.collection.image_url || item.image_url,
					symbol: item.collection?.symbol,
				};
			}
			// For solana, we rewrite
			// tokenAddress -> tokenId
			// groupId -> tokenAddress

			let nftId = getCompositeTokenId(
				item.collection.collection_id,
				item.contract_address,
			);
			if (!item.collection?.collection_id) {
				const tokenId = item.contract_address;

				const groupId =
					await this.heliusService.getGroupIdForNft(tokenId);
				nftId = getCompositeTokenId(groupId, tokenId);
				collectionsMap[item.contract_address].tokenAddress = groupId;
			}

			collectionsMap[item.contract_address].tokens.push({
				id: nftId,
				tokenId: item.contract_address,
				name: item.name,
				imageUrl: item.image_url,
				selected: selectedNftIds.has(nftId),
				ownerWalletAddress: walletAddress,
			});
		}

		for (const collection of Object.values(collectionsMap)) {
			nftCollections.push(collection);
		}

		return { nftCollections, next };
	}
}
