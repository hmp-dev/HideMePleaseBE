import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupportedChains } from '@prisma/client';

import { NftCollectionCursor } from '@/api/nft/nft.types';
import { NftOwnershipService } from '@/api/nft/nft-ownership.service';
import { SelectedNftOrderDTO, SelectNftDTO } from '@/api/users/users.dto';
import { PAGE_SIZES } from '@/constants';
import { NftCollectionWithTokens } from '@/modules/moralis/moralis.constants';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { UnifiedNftService } from '@/modules/unified-nft/unified-nft.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class UserNftService {
	constructor(
		private prisma: PrismaService,
		private nftOwnershipService: NftOwnershipService,
		private jwtService: JwtService,
		private unifiedNftService: UnifiedNftService,
	) {}

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

	async updateSelectedNftOrder({
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

		const walletNftCollections: NftCollectionWithTokens[] = [];
		let next: NftCollectionCursor = { liveData: true };

		for (const [index, walletAddress] of walletsAfterSkip.entries()) {
			const response = await this.unifiedNftService.getNftsForAddress({
				walletAddress,
				chainOrChains: chain,
				nextChain: parsedNextCursor?.nextChain,
				nextPage: parsedNextCursor?.nextPage,
				selectedNftIds,
			});

			const nextWallet = walletsAfterSkip[index + 1];
			if (response.next) {
				next = {
					...response.next,
					nextWalletAddress: walletAddress,
					liveData: true,
				};
			} else if (nextWallet) {
				next = { nextWalletAddress: nextWallet, liveData: true };
			} else {
				next = null;
			}

			walletNftCollections.push(
				...response.nftCollections.filter(
					(nftCollection) =>
						!selectedNftAddresses.has(nftCollection.tokenAddress),
				),
			);

			if (walletNftCollections.length >= PAGE_SIZES.NFT_COLLECTIONS) {
				break;
			}
		}

		await this.nftOwnershipService.syncWalletNftCollections(
			walletNftCollections,
		);
		await this.nftOwnershipService.syncWalletNftTokens(
			walletNftCollections,
		);

		return {
			collections: walletNftCollections,
			selectedNftCount,
			next: next ? this.jwtService.sign(next) : next,
		};
	}
}
