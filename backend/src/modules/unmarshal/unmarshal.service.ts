import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupportedChains } from '@prisma/client';
import axios from 'axios';

import { getCompositeTokenId } from '@/api/nft/nft.utils';
import { NftCollectionWithTokens } from '@/modules/moralis/moralis.constants';
import { UnmarshalSupportedChainMapping } from '@/modules/unmarshal/unmarshal.constants';
import { UnmarshalNftForAddressResponse } from '@/modules/unmarshal/unmarshal.types';
import { PickKey } from '@/types';
import { EnvironmentVariables } from '@/utils/env';

type UnmarshalSupportedTypes = PickKey<
	typeof SupportedChains,
	'ETHEREUM' | 'KLAYTN' | 'SOLANA'
>;

@Injectable()
export class UnmarshalService {
	client = axios.create({
		baseURL: 'https://api.unmarshal.com',
	});

	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
	) {}

	async getNftsForAddress({
		chain,
		walletAddress,
		nextPage,
		selectedNftIds,
	}: {
		walletAddress: string;
		chain: UnmarshalSupportedTypes;
		selectedNftIds: Set<string>;
		nextPage?: string;
	}): Promise<{
		nftCollections: NftCollectionWithTokens[];
		next?: string;
	}> {
		const response = await this.client.get<UnmarshalNftForAddressResponse>(
			`v3/${UnmarshalSupportedChainMapping[chain]}/address/${walletAddress}/nft-assets?auth_key=${this.configService.get('UNMARSHAL_API_KEY')}&offset=${nextPage ? parseInt(nextPage) : undefined}`,
		);

		const next = response.data.next_offset
			? response.data.next_offset.toString()
			: undefined;

		const collectionsMap: Record<string, NftCollectionWithTokens> = {};

		if (!response.data.nft_assets) {
			return {
				nftCollections: [],
			};
		}

		for (const item of response.data.nft_assets) {
			if (!collectionsMap[item.asset_contract]) {
				collectionsMap[item.asset_contract] = {
					tokens: [],
					chainSymbol: chain,
					name: item.asset_contract_name || item.description,
					tokenAddress: item.asset_contract,
					walletAddress: walletAddress,
					collectionLogo: item.issuer_specific_data?.image_url,
				};
			}

			const tokenId =
				item.token_id ||
				this.extractTokenIdFromName(item.issuer_specific_data.name);

			const nftId = getCompositeTokenId(item.asset_contract, tokenId);
			collectionsMap[item.asset_contract].tokens.push({
				id: nftId,
				tokenId,
				name: item.issuer_specific_data?.name,
				imageUrl: item.issuer_specific_data?.image_url,
				selected: selectedNftIds.has(nftId),
				ownerWalletAddress: walletAddress,
			});
		}

		return { nftCollections: Object.values(collectionsMap), next };
	}

	extractTokenIdFromName(name: string) {
		return name.split('#')[1];
	}
}
