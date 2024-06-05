import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupportedChains } from '@prisma/client';

import { SelectedNftOrderDTO, SelectNftDTO } from '@/api/nft/nft.dto';
import { NftCollectionCursor } from '@/api/nft/nft.types';
import { getCompositeTokenId } from '@/api/nft/nft.utils';
import { NftOwnershipService } from '@/api/nft/nft-ownership.service';
import { MediaService } from '@/modules/media/media.service';
import {
	EvmNftCollectionDataWithWallet,
	PAGE_SIZES,
} from '@/modules/moralis/moralis.constants';
import { MoralisNftService } from '@/modules/moralis/moralis-nft.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
	SupportedChainMapping,
	SupportedChainReverseMapping,
} from '@/modules/web3/web3.constants';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class NftService {
	constructor(
		private prisma: PrismaService,
		private moralisNftService: MoralisNftService,
		private mediaService: MediaService,
		private nftOwnershipService: NftOwnershipService,
		private jwtService: JwtService,
	) {}

	async getWelcomeNft() {
		const [welcomeNft, totalCount, usedCount] = await Promise.all([
			this.prisma.welcomeNft.findFirst({
				select: {
					id: true,
					image: true,
				},
				where: {
					used: false,
				},
				orderBy: {
					createdAt: 'asc',
				},
			}),
			this.prisma.welcomeNft.count(),
			this.prisma.welcomeNft.count({
				where: {
					used: true,
				},
			}),
		]);
		if (!welcomeNft) {
			throw new BadRequestException(ErrorCodes.MISSING_WELCOME_NFT);
		}
		return {
			...welcomeNft,
			totalCount,
			usedCount,
			image: this.mediaService.getUrl(welcomeNft.image),
		};
	}

	async consumeWelcomeNft({
		request,
		welcomeNftId,
	}: {
		request: Request;
		welcomeNftId: number;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const welcomeNft = await this.prisma.welcomeNft.findFirst({
			where: {
				id: welcomeNftId,
				used: false,
			},
			select: {
				id: true,
				siteLink: true,
			},
		});

		if (!welcomeNft) {
			// This might be used by the time user made this api call, let's try to find something else
			const newWelcomeNft = await this.prisma.welcomeNft.findFirst({
				select: {
					id: true,
					siteLink: true,
				},
				where: {
					used: false,
				},
				orderBy: {
					createdAt: 'asc',
				},
			});
			if (!newWelcomeNft) {
				// all are consumed
				throw new BadRequestException(ErrorCodes.MISSING_WELCOME_NFT);
			}

			await this.prisma.welcomeNft.update({
				where: {
					id: newWelcomeNft.id,
				},
				data: {
					used: true,
					userId: authContext.userId,
				},
			});

			return newWelcomeNft.siteLink;
		}

		await this.prisma.welcomeNft.update({
			where: {
				id: welcomeNft.id,
			},
			data: {
				used: true,
				userId: authContext.userId,
			},
		});

		return welcomeNft.siteLink;
	}

	private async getSelectedNftCollections(
		authContext: AuthContext,
		chain: SupportedChains,
	) {
		const selectedNfts = await this.prisma.nft.findMany({
			where: {
				selected: true,
				ownedWallet: {
					userId: authContext.userId,
				},
				...(chain && {
					nftCollection: {
						chain,
					},
				}),
			},
			select: {
				nftCollection: {
					select: {
						symbol: true,
						chain: true,
						tokenAddress: true,
						contractType: true,
						name: true,
						collectionLogo: true,
						Nft: {
							select: {
								id: true,
								tokenId: true,
								lastOwnershipCheck: true,
								name: true,
								imageUrl: true,
								selected: true,
							},
							where: {
								ownedWallet: {
									userId: authContext.userId,
								},
							},
							orderBy: {
								selected: 'desc',
							},
						},
					},
				},
			},
			orderBy: {
				order: 'asc',
			},
		});

		const transformedCollections = selectedNfts.map(
			({ nftCollection }) => ({
				...nftCollection,
				chainSymbol: nftCollection.chain,
				chain: SupportedChainMapping[nftCollection.chain].hex,
				Nft: undefined,
				tokens: nftCollection.Nft.map((nft) => ({
					...nft,
					lastOwnershipCheck: undefined,
					updatedAt: nft.lastOwnershipCheck,
				})),
			}),
		);

		return {
			collections: transformedCollections,
			selectedNftCount: selectedNfts.length,
			next: this.jwtService.sign({ liveData: true }),
		};
	}

	async getNftCollectionsPopulated(params: {
		nextCursor?: string;
		request: Request;
		chain: SupportedChains;
	}) {
		let response = await this.getNftCollections(params);
		const collections = response.collections;

		while (
			collections.length < PAGE_SIZES.NFT_COLLECTIONS &&
			response.next
		) {
			response = await this.getNftCollections({
				...params,
				nextCursor: response.next,
			});

			for (const collection of response.collections) {
				collections.push(collection);
			}
		}

		return {
			collections,
			selectedNftCount: response.selectedNftCount,
			next: response.next,
		};
	}

	async getNftCollections({
		request,
		chain,
		nextCursor,
	}: {
		request: Request;
		chain: SupportedChains;
		nextCursor?: string;
	}): Promise<{
		collections: any[];
		selectedNftCount: number;
		next: string | null;
	}> {
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
			return {
				collections: [],
				selectedNftCount: 0,
				next: null,
			};
		}

		const parsedNextCursor: NftCollectionCursor = nextCursor
			? this.jwtService.decode(nextCursor)
			: (null as NftCollectionCursor);

		if (!parsedNextCursor?.liveData) {
			const selectedCollections = await this.getSelectedNftCollections(
				authContext,
				chain,
			);
			if (selectedCollections.selectedNftCount) {
				return selectedCollections;
			}
		}

		const addresses = userWallets.map(({ publicAddress }) => publicAddress);
		const walletsAfterSkip = parsedNextCursor?.nextWalletAddress
			? addresses.slice(
					addresses.indexOf(parsedNextCursor.nextWalletAddress),
				)
			: addresses;

		const [selectedNfts, selectedNftCount] = await Promise.all([
			this.prisma.nft.findMany({
				where: {
					selected: true,
					ownedWallet: {
						userId: authContext.userId,
					},
				},
				select: {
					id: true,
					tokenAddress: true,
				},
			}),
			this.prisma.nft.count({
				where: {
					selected: true,
					ownedWallet: {
						userId: authContext.userId,
					},
				},
			}),
		]);
		const selectedNftIds = new Set(selectedNfts.map(({ id }) => id));
		const selectedNftAddresses = new Set(
			selectedNfts.map(({ tokenAddress }) => tokenAddress),
		);

		const walletNftCollections: EvmNftCollectionDataWithWallet[] = [];
		let next: NftCollectionCursor = { liveData: true };

		for (const [index, walletAddress] of walletsAfterSkip.entries()) {
			const nftCollections =
				await this.moralisNftService.getWalletNFTCollections({
					walletAddress,
					chainOrChains: chain,
					cursor: parsedNextCursor?.cursor || undefined,
					cursorType: parsedNextCursor?.cursorType,
				});

			const nextWallet = walletsAfterSkip[index + 1];
			if (nftCollections.next) {
				next = {
					...nftCollections.next,
					nextWalletAddress: walletAddress,
					liveData: true,
				};
			} else if (nextWallet) {
				next = { nextWalletAddress: nextWallet, liveData: true };
			} else {
				next = { liveData: true };
			}

			walletNftCollections.push(
				...nftCollections.nftCollections
					.filter(
						(nftCollection) =>
							!selectedNftAddresses.has(
								nftCollection.tokenAddress.toJSON(),
							),
					)
					.map((nftCollection) => ({
						...nftCollection.result,
						walletAddress,
					})),
			);
			if (walletNftCollections.length >= PAGE_SIZES.NFT_COLLECTIONS) {
				break;
			}
		}

		const populatedNftCollections =
			await this.moralisNftService.populateNftCollectionsWithTokens(
				walletNftCollections,
			);

		const responseCollections = populatedNftCollections.map(
			(nftCollection) => ({
				...nftCollection,
				chainSymbol:
					SupportedChainReverseMapping[nftCollection.chain.hex],
				tokens: nftCollection.tokens.map((token) => {
					const nftId = getCompositeTokenId(
						nftCollection.tokenAddress.toJSON(),
						token.tokenId,
					);
					return {
						id: nftId,
						tokenId: token.tokenId,
						name: token.name,
						updatedAt: token.media?.updatedAt,
						imageUrl: token.media?.mediaCollection?.medium.url,
						ownerWalletAddress:
							token.ownerOf?.toJSON() as unknown as string,
						selected: selectedNftIds.has(nftId),
					};
				}),
			}),
		);

		await this.nftOwnershipService.syncWalletNftCollections(
			walletNftCollections,
		);
		await this.nftOwnershipService.syncWalletNftTokens(responseCollections);

		return {
			collections: responseCollections,
			selectedNftCount,
			next: this.jwtService.sign(next),
		};
	}

	async getSelectedNfts({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const selectedNfts = await this.prisma.nft.findMany({
			where: {
				selected: true,
				ownedWallet: {
					userId: authContext.userId,
				},
			},
			select: {
				id: true,
				name: true,
				imageUrl: true,
				order: true,
				tokenAddress: true,
				nftCollection: {
					select: {
						symbol: true,
						chain: true,
						NftCollectionPoints: {
							select: {
								totalPoints: true,
								communityRank: true,
								totalMembers: true,
								pointFluctuation: true,
							},
						},
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
			NftCollectionPoints: undefined,
			...{
				totalPoints: 0,
				totalMembers: 1,
				pointFluctuation: 0,
				...selectedNft.nftCollection.NftCollectionPoints,
			},
		}));
	}

	async getSelectedNftsWithPoints({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const [selectedNfts, nftPoints] = await Promise.all([
			this.prisma.nft.findMany({
				where: {
					selected: true,
					ownedWallet: {
						userId: authContext.userId,
					},
				},
				select: {
					id: true,
					name: true,
					imageUrl: true,
					tokenAddress: true,
				},
				orderBy: {
					order: 'asc',
				},
			}),
			this.prisma.spaceBenefitUsage.groupBy({
				by: 'tokenAddress',
				where: {
					userId: authContext.userId,
				},
				_sum: {
					pointsEarned: true,
				},
			}),
		]);

		const pointMap: Record<string, number> = {};
		for (const point of nftPoints) {
			pointMap[point.tokenAddress] = point._sum.pointsEarned || 0;
		}

		return selectedNfts.map((selectedNft) => ({
			...selectedNft,
			totalPoints: pointMap[selectedNft.tokenAddress] || 0,
		}));
	}

	async toggleNftSelected({
		request,
		selectNftDTO: { selected, order, nftId },
	}: {
		request: Request;
		selectNftDTO: SelectNftDTO;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const nft = await this.prisma.nft.findFirst({
			where: {
				id: nftId,
			},
			select: {
				tokenAddress: true,
				nftCollection: {
					select: {
						chain: true,
					},
				},
			},
		});
		if (!nft) {
			throw new BadRequestException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		await Promise.all([
			this.prisma.nft.updateMany({
				where: {
					tokenAddress: nft.tokenAddress,
					nftCollection: {
						chain: nft.nftCollection.chain,
					},
					id: {
						not: nftId,
					},
				},
				data: {
					selected: false,
				},
			}),
			this.prisma.nft.update({
				where: {
					id: nftId,
				},
				data: {
					selected,
					order,
				},
			}),
		]);

		await this.checkUserPfpCriteria(authContext.userId);

		const selectedNftCount = await this.prisma.nft.count({
			where: {
				selected: true,
				ownedWallet: {
					userId: authContext.userId,
				},
			},
		});

		return {
			selectedNftCount,
		};
	}

	async updateSelectedNftCollectionOrder({
		request,
		selectedNftOrderDTO: { order },
	}: {
		request: Request;
		selectedNftOrderDTO: SelectedNftOrderDTO;
	}) {
		const orderMapping = Object.entries(order);

		await Promise.all(
			orderMapping.map(([index, id]) =>
				this.prisma.nft.update({
					where: {
						id,
					},
					data: {
						order: Number(index),
					},
				}),
			),
		);

		return this.getSelectedNfts({ request });
	}

	private async checkUserPfpCriteria(userId: string) {
		const user = await this.prisma.user.findFirst({
			where: {
				id: userId,
			},
			select: {
				pfpNftId: true,
			},
		});
		if (user?.pfpNftId) {
			return;
		}

		const userRecentNft = await this.prisma.nft.findFirst({
			where: {
				ownedWallet: {
					userId: userId,
				},
			},
			select: {
				id: true,
			},
			orderBy: {
				tokenUpdatedAt: 'asc',
			},
		});

		if (!userRecentNft) {
			return;
		}

		await this.prisma.user.update({
			where: {
				id: userId,
			},
			data: {
				pfpNftId: userRecentNft.id,
			},
		});
	}
}
