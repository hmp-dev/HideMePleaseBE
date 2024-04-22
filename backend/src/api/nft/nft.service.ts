import { Injectable } from '@nestjs/common';
import { SupportedChains } from '@prisma/client';

import { SelectedNftOrderDTO, SelectNftDTO } from '@/api/nft/nft.dto';
import {
	EvmNftCollectionDataWithWallet,
	PAGE_SIZES,
} from '@/modules/moralis/moralis.constants';
import { MoralisNftService } from '@/modules/moralis/moralis-nft.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SupportedChainReverseMapping } from '@/modules/web3/web3.constants';
import { AuthContext } from '@/types';

@Injectable()
export class NftService {
	constructor(
		private prisma: PrismaService,
		private moralisNftService: MoralisNftService,
	) {}

	getWelcomeNft({ request }: { request: Request }) {
		return Reflect.get(request, 'authContext') as AuthContext;
	}

	async getNftCollections({
		request,
		chain,
		cursor,
		cursorType,
		nextWalletAddress,
	}: {
		request: Request;
		chain: SupportedChains;
		cursor?: string;
		cursorType?: SupportedChains;
		nextWalletAddress?: string;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const userWallets = await this.prisma.wallet.findMany({
			where: {
				userId: authContext.userId,
			},
			select: {
				publicAddress: true,
			},
		});

		if (!userWallets.length) {
			return [];
		}

		const addresses = userWallets.map(({ publicAddress }) => publicAddress);
		const walletsAfterSkip = nextWalletAddress
			? addresses.slice(addresses.indexOf(nextWalletAddress))
			: addresses;

		const selectedNfts = await this.prisma.userSelectedNft.findMany({
			where: {
				userId: authContext.userId,
			},
			select: {
				walletAddress: true,
				tokenAddress: true,
				tokenId: true,
				chain: true,
			},
		});

		const walletNftCollections: EvmNftCollectionDataWithWallet[] = [];
		let next: {
			type?: SupportedChains;
			cursor?: string | null;
			nextWalletAddress?: string;
		} | null = null;

		for (const [index, walletAddress] of walletsAfterSkip.entries()) {
			const nftCollections =
				await this.moralisNftService.getWalletNFTCollections({
					walletAddress,
					chainOrChains: chain,
					cursor,
					cursorType,
				});

			const nextWallet = walletsAfterSkip[index + 1];
			if (nftCollections.next) {
				next = {
					...nftCollections.next,
					nextWalletAddress: walletAddress,
				};
			} else if (nextWallet) {
				next = { nextWalletAddress: nextWallet };
			} else {
				next = null;
			}

			walletNftCollections.push(
				...nftCollections.nftCollections.map((nftCollection) => ({
					...nftCollection.result,
					walletAddress,
				})),
			);
			if (walletNftCollections.length >= PAGE_SIZES.NFT_COLLECTIONS) {
				break;
			}
		}

		await this.syncWalletNfcCollections(walletNftCollections);

		const populatedNftCollections =
			await this.moralisNftService.populateNftCollectionsWithTokens(
				walletNftCollections,
			);

		const responseCollections = populatedNftCollections.map(
			(nftCollection) => ({
				...nftCollection,
				chainSymbol:
					SupportedChainReverseMapping[nftCollection.chain.hex],
				tokens: nftCollection.tokens.map((token) => ({
					tokenId: token.tokenId,
					name: token.name,
					imageUrl: token.media?.mediaCollection?.medium.url,
					selected: selectedNfts.some(
						(selectedNft) =>
							selectedNft.tokenId === token.tokenId &&
							selectedNft.chain === nftCollection.chain.hex &&
							selectedNft.tokenAddress ===
								nftCollection.tokenAddress.toJSON() &&
							selectedNft.walletAddress ===
								nftCollection.walletAddress,
					),
				})),
			}),
		);

		return {
			collections: responseCollections,
			next,
		};
	}

	async getSelectedNftCollections({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const selectedNfts = await this.prisma.userSelectedNft.findMany({
			where: {
				userId: authContext.userId,
			},
			select: {
				id: true,
				order: true,
				nftCollection: {
					select: {
						name: true,
						symbol: true,
						collectionLogo: true,
						chain: true,
					},
				},
			},
			orderBy: {
				order: 'asc',
			},
		});

		return selectedNfts.map((selectedNft) => ({
			...selectedNft,
			nftCollection: undefined,
			...selectedNft.nftCollection,
		}));
	}

	async toggleNftSelected({
		request,
		selectNftDTO: {
			walletAddress,
			tokenAddress,
			tokenId,
			chain,
			selected,
			order,
		},
	}: {
		request: Request;
		selectNftDTO: SelectNftDTO;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const selectedNft = await this.prisma.userSelectedNft.findFirst({
			where: {
				userId: authContext.userId,
				walletAddress,
				tokenAddress,
				tokenId,
				chain,
			},
			select: {
				id: true,
			},
		});

		if (selectedNft) {
			if (!selected) {
				await this.prisma.userSelectedNft.delete({
					where: { id: selectedNft.id },
				});
			} else {
				return;
			}
		} else {
			if (selected) {
				await this.prisma.userSelectedNft.create({
					data: {
						userId: authContext.userId,
						walletAddress,
						tokenAddress,
						tokenId,
						chain,
						order,
					},
				});
			} else {
				return;
			}
		}
	}

	private async syncWalletNfcCollections(
		walletNftCollections: EvmNftCollectionDataWithWallet[],
	) {
		const alreadyCreatedCollections =
			await this.prisma.nftCollection.findMany({
				where: {
					tokenAddress: {
						in: walletNftCollections.map((walletNftCollection) =>
							walletNftCollection.tokenAddress.toJSON(),
						),
					},
				},
				select: {
					tokenAddress: true,
				},
			});

		const excludedAddresses = new Set(
			alreadyCreatedCollections.map(
				(collection) => collection.tokenAddress,
			),
		);

		const finalCollections = walletNftCollections.filter(
			(walletNftCollection) =>
				!excludedAddresses.has(
					walletNftCollection.tokenAddress.toJSON(),
				),
		) as (EvmNftCollectionDataWithWallet & { collectionLogo: string })[];

		await this.prisma.nftCollection.createMany({
			data: finalCollections.map(
				({
					name,
					symbol,
					tokenAddress,
					contractType,
					collectionLogo,
					chain,
				}) => ({
					name,
					symbol: symbol || name || '',
					tokenAddress: tokenAddress.toJSON(),
					contractType: contractType || '',
					collectionLogo,
					chain: SupportedChainReverseMapping[chain.hex],
				}),
			),
		});
	}

	async updateSelectedNftCollectionOrder({
		request,
		selectedNftOrderDTO: { order },
	}: {
		request: Request;
		selectedNftOrderDTO: SelectedNftOrderDTO;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const orderMapping = Object.entries(order);

		await Promise.all(
			orderMapping.map((orderMap) =>
				this.prisma.userSelectedNft.update({
					where: {
						id: orderMap[1],
						userId: authContext.userId,
					},
					data: {
						order: Number(orderMap[0]),
					},
				}),
			),
		);

		return this.getSelectedNftCollections({ request });
	}
}
