import { Injectable } from '@nestjs/common';
import { subDays, subMinutes } from 'date-fns';

import { HOT_NFT_DAYS, NFT_COMMUNITY_PAGE_SIZE } from '@/api/nft/nft.constants';
import { NftCommunitySortOrder } from '@/api/nft/nft.types';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class NftCommunityService {
	constructor(private prisma: PrismaService) {}

	async getNftCommunities({
		page,
		order,
	}: {
		request: Request;
		page: number;
		order: NftCommunitySortOrder;
	}) {
		const currentPage = isNaN(page) || !page ? 1 : page;

		const [allNftCommunities, communityCount] = await Promise.all([
			// this.prisma.nftCollection.findMany({
			// 	where: {
			// 		Nft: {
			// 			some: {
			// 				ownedWallet: {
			// 					userId: authContext.userId,
			// 				},
			// 			},
			// 		},
			// 	},
			// 	select: {
			// 		tokenAddress: true,
			// 	},
			// }),
			this.prisma.nftCollectionPoints.findMany({
				take: NFT_COMMUNITY_PAGE_SIZE,
				skip: NFT_COMMUNITY_PAGE_SIZE * (currentPage - 1),
				orderBy: {
					...(order === NftCommunitySortOrder.MEMBERS && {
						totalMembers: 'desc',
					}),
					...(order === NftCommunitySortOrder.POINTS && {
						totalPoints: 'desc',
					}),
				},
				select: {
					communityRank: true,
					totalMembers: true,
					nftCollection: {
						select: {
							tokenAddress: true,
							name: true,
							collectionLogo: true,
							chain: true,
						},
					},
				},
			}),
			this.prisma.nft.groupBy({
				by: 'tokenAddress',
			}),
		]);

		const allCommunities = allNftCommunities.map(
			({ nftCollection, ...rest }) => ({
				...rest,
				...nftCollection,
				lastConversation: subMinutes(
					new Date(),
					1 + Math.floor(Math.random() * 100),
				),
			}),
		);

		return {
			communityCount: communityCount.length,
			itemCount: communityCount.length,
			allCommunities,
		};
	}

	async getUserNftCommunities({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const userCommunityList = await this.prisma.nftCollection.findMany({
			where: {
				Nft: {
					some: {
						ownedWallet: {
							userId: authContext.userId,
						},
					},
				},
			},
			select: {
				tokenAddress: true,
				name: true,
				collectionLogo: true,
				chain: true,
				NftCollectionPoints: {
					select: {
						totalMembers: true,
					},
				},
			},
		});

		return userCommunityList.map(({ NftCollectionPoints, ...rest }) => ({
			...rest,
			...NftCollectionPoints,
		}));
	}

	async getHottestNftCommunities() {
		const nftCounts = await this.prisma.nft.groupBy({
			by: 'tokenAddress',
			where: {
				createdAt: {
					gte: subDays(new Date(), HOT_NFT_DAYS),
				},
			},
			_count: true,
			having: {
				tokenAddress: {
					_count: {
						gt: 1,
					},
				},
			},
		});

		const topNfts = nftCounts
			.sort((nftA, nftB) => (nftA._count < nftB._count ? 1 : -1))
			.slice(0, 3);
		//
		// const nftMemberCounts = await this.prisma.nft.groupBy({
		// 	by: 'tokenAddress',
		// 	where: {
		// 		tokenAddress: {
		// 			in: topNfts.map((nft) => nft.tokenAddress),
		// 		},
		// 	},
		// 	_count: true,
		// });

		const hottestCommunities = await this.prisma.nftCollection.findMany({
			where: {
				tokenAddress: {
					in: topNfts.map((nft) => nft.tokenAddress),
				},
			},
			select: {
				tokenAddress: true,
				name: true,
				collectionLogo: true,
				chain: true,
				NftCollectionPoints: {
					select: {
						totalMembers: true,
					},
				},
			},
		});

		return topNfts.map(({ tokenAddress }) => ({
			totalMembers:
				hottestCommunities.find(
					(community) => community.tokenAddress === tokenAddress,
				)?.NftCollectionPoints?.totalMembers || 0,
			...hottestCommunities.find(
				(community) => community.tokenAddress === tokenAddress,
			),
			NftCollectionPoints: undefined,
		}));
	}

	async getNftCollectionInfo({
		tokenAddress,
		request,
	}: {
		tokenAddress: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const [userCommunity, nftCollection] = await Promise.all([
			this.prisma.nftCollection.findFirst({
				where: {
					Nft: {
						some: {
							ownedWallet: {
								userId: authContext.userId,
							},
						},
					},
					tokenAddress,
				},
				select: {
					tokenAddress: true,
				},
			}),
			this.prisma.nftCollection.findFirst({
				where: {
					tokenAddress,
				},
				select: {
					name: true,
					chain: true,
					collectionLogo: true,
					NftCollectionPoints: {
						select: {
							totalPoints: true,
							communityRank: true,
						},
					},
				},
			}),
		]);

		return {
			...nftCollection,
			NftCollectionPoints: undefined,
			...nftCollection?.NftCollectionPoints,
			ownedCollection: !!userCommunity,
		};
	}
}
