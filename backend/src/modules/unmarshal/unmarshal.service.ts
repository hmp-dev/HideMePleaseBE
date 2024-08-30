import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupportedChains } from '@prisma/client';
import axios from 'axios';

import { getCompositeTokenId } from '@/api/nft/nft.utils';
import { HeliusService } from '@/modules/helius/helius.service';
import { MediaService } from '@/modules/media/media.service';
import { NftCollectionWithTokens } from '@/modules/moralis/moralis.constants';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { UnmarshalSupportedChainMapping } from '@/modules/unmarshal/unmarshal.constants';
import { UnmarshalNftForAddressResponse } from '@/modules/unmarshal/unmarshal.types';
import { PickKey } from '@/types';
import { EnvironmentVariables } from '@/utils/env';
import { ErrorCodes } from '@/utils/errorCodes';

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
		private prisma: PrismaService,
		private mediaService: MediaService,
		private heliusService: HeliusService,
	) {}

	async getKlaytnSystemNftsForAddress(
		walletAddress: string,
		selectedNftIds: Set<string>,
	): Promise<NftCollectionWithTokens[]> {
		const systemNftCollections =
			await this.prisma.systemNftCollection.findMany({
				where: {
					SystemNft: {
						some: {
							recipientAddress: walletAddress,
						},
					},
				},
				include: {
					SystemNft: {
						where: {
							recipientAddress: walletAddress,
						},
					},
					image: true,
				},
			});

		return systemNftCollections.map((systemNftCollection) => {
			return {
				symbol: systemNftCollection.symbol,
				chainSymbol: SupportedChains.KLAYTN,
				chain: SupportedChains.KLAYTN,
				name: systemNftCollection.name,
				tokenAddress: systemNftCollection.tokenAddress,
				walletAddress: walletAddress,
				collectionLogo: this.mediaService.getUrl(
					systemNftCollection.image,
				),
				category: systemNftCollection.category
					? systemNftCollection.category
					: undefined,
				tokens: systemNftCollection.SystemNft.map((systemNft) => ({
					id: systemNft.id,
					tokenId: systemNft.tokenId.toString(),
					name: systemNft.name,
					imageUrl: this.mediaService.getUrl(
						systemNftCollection.image,
					),
					selected: selectedNftIds.has(systemNft.id),
					ownerWalletAddress: walletAddress,
				})),
			};
		});
	}

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
		const nftCollections: NftCollectionWithTokens[] = [];

		if (!nextPage && chain === SupportedChains.KLAYTN) {
			const systemCollections = await this.getKlaytnSystemNftsForAddress(
				walletAddress,
				selectedNftIds,
			);
			for (const systemNft of systemCollections) {
				nftCollections.push(systemNft);
			}
		}

		const response = await this.client.get<UnmarshalNftForAddressResponse>(
			`v3/${UnmarshalSupportedChainMapping[chain]}/address/${walletAddress}/nft-assets?auth_key=${this.configService.get('UNMARSHAL_API_KEY')}&offset=${nextPage ? parseInt(nextPage) : undefined}`,
		);

		const next = response.data.next_offset
			? response.data.next_offset.toString()
			: undefined;

		const collectionsMap: Record<string, NftCollectionWithTokens> = {};

		if (!response.data.nft_assets) {
			return {
				nftCollections,
			};
		}

		for (const item of response.data.nft_assets) {
			if (!collectionsMap[item.asset_contract]) {
				collectionsMap[item.asset_contract] = {
					tokens: [],
					chainSymbol: chain,
					name: (
						item.asset_contract_name ||
						item.issuer_specific_data?.name ||
						''
					)
						.replace(/[0-9]/g, '')
						.replaceAll('#', ''),
					tokenAddress: item.asset_contract,
					walletAddress: walletAddress,
					collectionLogo: item.issuer_specific_data?.image_url,
				};
			}

			if (chain === SupportedChains.SOLANA) {
				// For solana, we rewrite
				// tokenAddress -> tokenId
				// groupId -> tokenAddress
				const tokenId =
					collectionsMap[item.asset_contract].tokenAddress;

				const groupId =
					await this.heliusService.getGroupIdForNft(tokenId);
				const nftId = getCompositeTokenId(groupId, tokenId);
				collectionsMap[item.asset_contract].tokenAddress = groupId;

				collectionsMap[item.asset_contract].tokens.push({
					id: nftId,
					tokenId,
					name: item.issuer_specific_data?.name,
					imageUrl: item.issuer_specific_data?.image_url,
					selected: selectedNftIds.has(nftId),
					ownerWalletAddress: walletAddress,
				});
			} else {
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
		}

		for (const collection of Object.values(collectionsMap)) {
			nftCollections.push(collection);
		}

		return { nftCollections, next };
	}

	extractTokenIdFromName(name: string) {
		return name.split('#')[1];
	}

	async checkNftOwner({
		chain,
		tokenId,
		tokenAddress,
		walletAddress,
	}: {
		tokenAddress: string;
		chain: UnmarshalSupportedTypes;
		tokenId: string;
		walletAddress: string;
	}) {
		if (chain === SupportedChains.KLAYTN) {
			const response = await this.client.get<string[]>(
				`v1/${UnmarshalSupportedChainMapping[chain]}/address/${tokenAddress}/nftholders?tokenId=${tokenId}&auth_key=${this.configService.get('UNMARSHAL_API_KEY')}`,
			);
			if (!response.data.length) {
				return false;
			}

			const owners = response.data;

			return owners[owners.length - 1] === walletAddress;
		} else if (chain === SupportedChains.SOLANA) {
			// Currently this was the only way to check ownership in solana
			const allNftsInWallet = await this.getNftsForAddress({
				chain,
				walletAddress,
				selectedNftIds: new Set(),
			});

			for (const nftCollection of allNftsInWallet.nftCollections) {
				if (nftCollection.tokenAddress === tokenAddress) {
					return true;
				}
			}

			return false;
		}

		throw new NotImplementedException(ErrorCodes.MISSING_IMPLEMENTATION);
	}
}
