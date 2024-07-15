import { Injectable } from '@nestjs/common';
import { subMinutes } from 'date-fns';

import {
	NFT_COMMUNITY_PAGE_SIZE,
	NFT_MAX_HOTTEST_COMMUNITIES,
} from '@/api/nft/nft.constants';
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

	async getHottestNftCommunities({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		// TODO: implement logic to find communities with highest events
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
			},
		});

		if (userCommunityList.length === 0) {
			return [];
		}
		// this should be userCommunities.length === 1

		const hottestCommunities = await this.prisma.nftCollection.findMany({
			where: {
				NOT: {
					tokenAddress: {
						in: userCommunityList.map(
							({ tokenAddress }) => tokenAddress,
						),
					},
				},
			},
			take: NFT_MAX_HOTTEST_COMMUNITIES,
			select: {
				tokenAddress: true,
				name: true,
				collectionLogo: true,
				chain: true,
			},
		});

		return hottestCommunities.map((community) => ({
			...community,
			eventCount: 1 + Math.floor(Math.random() * 100),
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
