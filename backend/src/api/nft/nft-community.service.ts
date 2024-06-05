import { Injectable } from '@nestjs/common';
import { subMinutes } from 'date-fns';

import { NFT_COMMUNITY_PAGE_SIZE } from '@/api/nft/nft.constants';
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

		const userCommunities = userCommunityList.map(
			({ NftCollectionPoints, ...rest }) => ({
				...rest,
				...NftCollectionPoints,
			}),
		);

		// TODO: implement logic to find communities with highest events
		// this should be userCommunities.length === 1
		const hottestCommunities =
			userCommunities.length > 0
				? allCommunities
						.slice(0, 4)
						.map(({ name, chain, collectionLogo }) => ({
							name,
							chain,
							collectionLogo,
							eventCount: 1 + Math.floor(Math.random() * 100),
						}))
				: [];

		return {
			communityCount,
			itemCount: communityCount - userCommunities.length,
			allCommunities,
			userCommunities,
			hottestCommunities,
		};
	}
}
