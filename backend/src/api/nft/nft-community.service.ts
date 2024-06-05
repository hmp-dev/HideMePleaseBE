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
		request,
		page,
		order,
	}: {
		request: Request;
		page: number;
		order: NftCommunitySortOrder;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const currentPage = isNaN(page) || !page ? 1 : page;

		const [userCommunityList, allNftCommunities, communityCount] =
			await Promise.all([
				this.prisma.nftCollection.findMany({
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
				}),
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
				this.prisma.nftCollection.count(),
			]);

		const userCommunityAddresses = new Set<string>();
		for (const community of userCommunityList) {
			userCommunityAddresses.add(community.tokenAddress);
		}

		const allCommunities = allNftCommunities
			.filter(
				(community) =>
					!userCommunityAddresses.has(
						community.nftCollection.tokenAddress,
					),
			)
			.map(({ nftCollection, ...rest }) => ({
				...rest,
				...nftCollection,
				lastConversation: subMinutes(
					new Date(),
					1 + Math.floor(Math.random() * 100),
				),
			}));

		return {
			communityCount,
			itemCount: communityCount - userCommunityList.length,
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
}
