import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupportedChains } from '@prisma/client';
import { type Cache } from 'cache-manager';
import { GeoPosition } from 'geo-position.ts';

import {
	BENEFIT_PAGE_SIZE,
	BENEFIT_USAGE_PAGE_SIZE,
	NFT_MEMBERS_PAGE_SIZE,
	TOP_NFT_PAGE_SIZE,
} from '@/api/nft/nft.constants';
import { BenefitUsageType } from '@/api/nft/nft.types';
import { getAllEligibleLevels } from '@/api/nft/nft.utils';
import { CACHE_TTL } from '@/constants';
import { MediaService } from '@/modules/media/media.service';
import { MoralisApiService } from '@/modules/moralis/moralis-api.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
	ChainToSymbolMapping,
	SupportedChainMapping,
} from '@/modules/web3/web3.constants';
import { AuthContext, SortOrder } from '@/types';
import { EnvironmentVariables } from '@/utils/env';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class NftBenefitsService {
	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
		private moralisApiService: MoralisApiService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
		private configService: ConfigService<EnvironmentVariables, true>,
	) {}

	async getCollectionBenefits({
		tokenAddress,
		request,
		page,
		pageSize = BENEFIT_PAGE_SIZE,
		spaceId,
	}: {
		request: Request;
		tokenAddress: string;
		page: number;
		pageSize?: number;
		spaceId?: string;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const currentPage = isNaN(page) || !page ? 1 : page;

		const collectionPoints = await this.getCollectionPoints(tokenAddress);
		const benefitLevels = getAllEligibleLevels(collectionPoints);

		const [spaceBenefits, benefitCount] = await Promise.all([
			this.prisma.spaceBenefit.findMany({
				where: {
					level: {
						in: benefitLevels,
					},
					active: true,
					spaceId,
				},
				select: {
					id: true,
					description: true,
					singleUse: true,
					space: {
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
					SpaceBenefitUsage: {
						select: { createdAt: true, tokenAddress: true },
						where: {
							userId: authContext.userId,
						},
						orderBy: {
							createdAt: 'desc',
						},
					},
				},
				take: Number(pageSize),
				skip: Number(pageSize) * (currentPage - 1),
			}),
			this.prisma.spaceBenefit.count({
				where: {
					level: {
						in: benefitLevels,
					},
					active: true,
					spaceId,
				},
			}),
		]);

		return {
			benefits: spaceBenefits.map(
				({ space, SpaceBenefitUsage, ...rest }) => {
					let used = false;
					if (SpaceBenefitUsage.length) {
						used = rest.singleUse
							? true
							: SpaceBenefitUsage.some(
									(benefitUsage) =>
										benefitUsage.tokenAddress ===
										tokenAddress,
								);
					}

					return {
						...rest,
						spaceId: space.id,
						spaceName: space.name,
						spaceImage: this.mediaService.getUrl(space.image),
						used,
						tokenAddress,
					};
				},
			),
			benefitCount,
		};
	}

	async getCollectionPoints(tokenAddress: string) {
		// 	TODO: update this method when chat point system is made
		const points = await this.prisma.spaceBenefitUsage.aggregate({
			_sum: {
				pointsEarned: true,
			},
			where: {
				tokenAddress,
			},
		});

		return points._sum.pointsEarned || 0;
	}

	async getNftCollectionUsageHistory({
		tokenAddress,
		page,
		request,
		order,
	}: {
		tokenAddress: string;
		request: Request;
		type?: BenefitUsageType;
		page: number;
		order?: SortOrder;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const currentPage = isNaN(page) || !page ? 1 : page;
		// TODO: handle type

		const [spaceBenefitUsages, usageCount] = await Promise.all([
			this.prisma.spaceBenefitUsage.findMany({
				where: {
					userId: authContext.userId,
					tokenAddress,
				},
				select: {
					id: true,
					pointsEarned: true,
					createdAt: true,
					benefit: {
						select: {
							description: true,
							space: {
								select: {
									name: true,
								},
							},
						},
					},
				},
				orderBy: {
					...(order === SortOrder.NEWEST && {
						createdAt: 'desc',
					}),
					...(order === SortOrder.OLDEST && {
						createdAt: 'asc',
					}),
					...(!order && {
						benefit: {
							description: 'desc',
						},
					}),
				},
				take: BENEFIT_USAGE_PAGE_SIZE,
				skip: BENEFIT_USAGE_PAGE_SIZE * (currentPage - 1),
			}),
			this.prisma.spaceBenefitUsage.count({
				where: {
					userId: authContext.userId,
					tokenAddress,
				},
			}),
		]);

		return {
			items: spaceBenefitUsages.map((spaceBenefit) => ({
				...spaceBenefit,
				benefit: undefined,
				spaceName: spaceBenefit.benefit.space.name,
				benefitDescription: spaceBenefit.benefit.description,
				type: BenefitUsageType.SPACE_VISIT,
			})),
			count: usageCount,
		};
	}

	async getNftCollectionNetworkInfo({
		tokenAddress,
	}: {
		tokenAddress: string;
		request: Request;
	}) {
		const cacheKey = `NFT_NETWORK_INFO_${tokenAddress}`;
		const cachedData = await this.cacheManager.get(cacheKey);
		if (cachedData) {
			return cachedData;
		}

		const tokenData = await this.prisma.nftCollection.findFirst({
			where: {
				tokenAddress,
			},
			select: {
				chain: true,
			},
		});
		if (!tokenData) {
			throw new BadRequestException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		if (
			tokenData.chain === SupportedChains.KLAYTN ||
			tokenData.chain === SupportedChains.SOLANA
		) {
			// TODO: implement this lmao
			return {
				network: tokenData.chain,
				holderCount: 5652,
				floorPrice: 0.004,
				symbol: ChainToSymbolMapping[tokenData.chain],
			};
		}

		const [collectionStats, lowestPrice] = await Promise.all([
			this.moralisApiService.getNFTCollectionStats({
				address: tokenAddress,
				chain: SupportedChainMapping[tokenData.chain],
			}),
			this.moralisApiService.getNFTLowestPrice({
				address: tokenAddress,
				chain: SupportedChainMapping[tokenData.chain],
			}),
		]);

		const res = {
			network: tokenData.chain,
			holderCount: collectionStats.result.owners.current,
			floorPrice: lowestPrice?.result.price.ether || 0,
			symbol: ChainToSymbolMapping[tokenData.chain],
		};
		await this.cacheManager.set(
			cacheKey,
			res,
			CACHE_TTL.THIRTY_MIN_IN_MILLISECONDS,
		);

		return res;
	}

	async getNftCollectionSpaces({
		tokenAddress,
		latitude,
		longitude,
	}: {
		tokenAddress: string;
		request: Request;
		latitude: number;
		longitude: number;
	}) {
		const collectionPoints = await this.getCollectionPoints(tokenAddress);
		const benefitLevels = getAllEligibleLevels(collectionPoints);

		const spacesOfferingTheseBenefits = await this.prisma.space.findMany({
			where: {
				SpaceBenefit: {
					some: {
						level: {
							in: benefitLevels,
						},
					},
				},
			},
			select: {
				id: true,
				name: true,
				latitude: true,
				longitude: true,
				address: true,
				image: true,
			},
		});

		const populatedSpaces = spacesOfferingTheseBenefits.map((space) => ({
			...space,
			image: this.mediaService.getUrl(space.image),
		}));

		const userPosition = new GeoPosition(latitude, longitude);
		const maxDistance = this.configService.get<number>(
			'MAX_DISTANCE_FROM_SPACE',
		);
		const spacesWithDistance = populatedSpaces.map((space) => {
			const spacePosition = new GeoPosition(
				space.latitude,
				space.longitude,
			);

			return {
				...space,
				distance: Number(
					userPosition.Distance(spacePosition).toFixed(0),
				),
			};
		});

		const sortedSpaces = spacesWithDistance.sort((spaceA, spaceB) =>
			spaceA.distance > spaceB.distance ? 1 : -1,
		);

		const filteredSpaces = sortedSpaces.filter(
			(space) => space.distance <= maxDistance,
		);

		if (filteredSpaces.length) {
			return {
				spaces: filteredSpaces,
				ambiguous: filteredSpaces.length > 1,
			};
		} else {
			return { spaces: [], ambiguous: true };
		}
	}

	async getNftCollectionMembers({
		tokenAddress,
		page,
	}: {
		tokenAddress: string;
		request: Request;
		page: number;
	}) {
		const currentPage = isNaN(page) || !page ? 1 : page;

		const [nftMembers, nftMemberCount] = await Promise.all([
			this.prisma.nftCollectionMemberPoints.findMany({
				where: {
					tokenAddress,
				},
				select: {
					user: {
						select: {
							id: true,
							nickName: true,
							introduction: true,
							pfpNft: {
								select: {
									imageUrl: true,
								},
							},
						},
					},
					totalPoints: true,
					pointFluctuation: true,
					memberRank: true,
				},
				take: NFT_MEMBERS_PAGE_SIZE,
				skip: NFT_MEMBERS_PAGE_SIZE * (currentPage - 1),
				orderBy: {
					memberRank: 'asc',
				},
			}),
			this.prisma.nftCollectionMemberPoints.count({
				where: {
					tokenAddress,
				},
			}),
		]);

		return {
			members: nftMembers.map((nftMember) => ({
				...nftMember,
				user: undefined,
				userId: nftMember.user.id,
				name: nftMember.user.nickName,
				introduction: nftMember.user.introduction,
				pfpImage: nftMember.user.pfpNft?.imageUrl,
			})),
			nftMemberCount,
		};
	}

	async getTopNftCollections({
		page,
		pageSize = TOP_NFT_PAGE_SIZE,
		request,
	}: {
		page: number;
		pageSize?: number;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const currentPage = isNaN(page) || !page ? 1 : page;

		const [topCollections, userCommunityList] = await Promise.all([
			this.prisma.nftCollectionPoints.findMany({
				orderBy: {
					communityRank: 'desc',
				},
				take: Number(pageSize),
				skip: Number(pageSize) * (currentPage - 1),
				select: {
					pointFluctuation: true,
					totalPoints: true,
					tokenAddress: true,
					totalMembers: true,
					communityRank: true,
					nftCollection: {
						select: {
							collectionLogo: true,
							name: true,
							chain: true,
						},
					},
				},
			}),
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
				},
			}),
		]);

		const userCommunityAddresses = new Set<string>();
		for (const community of userCommunityList) {
			userCommunityAddresses.add(community.tokenAddress);
		}

		return topCollections.map(({ nftCollection, ...rest }) => ({
			...rest,
			...nftCollection,
			ownedCollection: userCommunityAddresses.has(rest.tokenAddress),
		}));
	}
}
