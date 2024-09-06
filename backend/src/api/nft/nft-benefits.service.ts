import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { SpaceCategory, SupportedChains } from '@prisma/client';
import { type Cache } from 'cache-manager';
import { GeoPosition } from 'geo-position.ts';

import {
	BENEFIT_PAGE_SIZE,
	BENEFIT_USAGE_PAGE_SIZE,
	NFT_MEMBERS_PAGE_SIZE,
	TOP_NFT_PAGE_SIZE,
} from '@/api/nft/nft.constants';
import { BenefitState, BenefitUsageType } from '@/api/nft/nft.types';
import { getAllEligibleLevels } from '@/api/nft/nft.utils';
import { SpaceLocationService } from '@/api/space/space-location.service';
import { CACHE_TTL } from '@/constants';
import { MediaService } from '@/modules/media/media.service';
import { MoralisApiService } from '@/modules/moralis/moralis-api.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SystemConfigService } from '@/modules/system-config/system-config.service';
import {
	ChainToSymbolMapping,
	SupportedChainMapping,
} from '@/modules/web3/web3.constants';
import { AuthContext, SortOrder } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';
import { benefitUsageResetTime } from '@/utils/time';

@Injectable()
export class NftBenefitsService {
	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
		private moralisApiService: MoralisApiService,
		private systemConfig: SystemConfigService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
		private spaceLocationService: SpaceLocationService,
	) {}

	async getCollectionBenefits({
		tokenAddress,
		request,
		page,
		pageSize = BENEFIT_PAGE_SIZE,
		spaceId,
		latitude,
		longitude,
	}: {
		request: Request;
		tokenAddress: string;
		page: number;
		pageSize?: number;
		spaceId?: string;
		latitude?: number;
		longitude?: number;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const currentPage = isNaN(page) || !page ? 1 : page;

		const collectionPoints = await this.getCollectionPoints(tokenAddress);
		const benefitLevels = getAllEligibleLevels(collectionPoints);

		const spaceIds = spaceId ? [spaceId] : [];

		const nftInstance = await this.prisma.nft.findFirst({
			where: {
				tokenAddress,
				ownedWallet: {
					userId: authContext.userId,
				},
			},
			select: {
				name: true,
				imageUrl: true,
				videoUrl: true,
				nftCollection: {
					select: {
						name: true,
						collectionLogo: true,
						chain: true,
						category: true,
						NftCollectionAllowedSpace: {
							select: {
								SpaceId: true,
							},
						},
					},
				},
			},
		});

		if (!nftInstance) {
			throw new NotFoundException(ErrorCodes.NFT_NOT_FOUND);
		}

		const allowedSpaces =
			nftInstance.nftCollection.NftCollectionAllowedSpace.map(
				(space) => space.SpaceId,
			).filter((spaceId) => spaceId) as string[];

		if (
			allowedSpaces.length &&
			spaceIds.length === 1 &&
			!allowedSpaces.includes(spaceIds[0])
		) {
			return {
				benefits: [],
				benefitCount: 0,
			};
		}

		if (nftInstance?.nftCollection.category && spaceId) {
			const space = await this.prisma.space.findFirst({
				where: {
					id: spaceId,
				},
				select: {
					category: true,
				},
			});
			if (!space) {
				throw new BadRequestException(ErrorCodes.ENTITY_NOT_FOUND);
			}
			if (space.category !== nftInstance.nftCollection.category) {
				return {
					benefits: [],
					benefitCount: 0,
				};
			}
		}

		if (latitude && longitude) {
			let sortedSpaceIds =
				await this.spaceLocationService.getSpacesSortedByLocation({
					latitude,
					longitude,
				});
			if (nftInstance?.nftCollection.category) {
				const spacesWithCategory =
					await this.spaceLocationService.getSpacesForCategory(
						nftInstance.nftCollection.category,
					);
				sortedSpaceIds = sortedSpaceIds.filter((spaceId) =>
					spacesWithCategory.has(spaceId),
				);
			} else {
				const spacesWithCategory =
					await this.spaceLocationService.getSpacesForCategory(
						SpaceCategory.WALKERHILL,
					);
				sortedSpaceIds = sortedSpaceIds.filter(
					(spaceId) => !spacesWithCategory.has(spaceId),
				);
			}

			if (allowedSpaces.length) {
				sortedSpaceIds = sortedSpaceIds.filter((spaceId) =>
					allowedSpaces.includes(spaceId),
				);
			}

			const skip = pageSize * (currentPage - 1);
			if (skip >= sortedSpaceIds.length) {
				return {
					benefits: [],
					benefitCount: await this.prisma.spaceBenefit.count({
						where: {
							level: {
								in: benefitLevels,
							},
							active: true,
							spaceId,
							...(nftInstance?.nftCollection.category && {
								space: {
									category:
										nftInstance.nftCollection.category,
								},
							}),
						},
					}),
				};
			}
			sortedSpaceIds
				.slice(skip, pageSize + skip)
				.forEach((spaceId) => spaceIds.push(spaceId));
		} else if (allowedSpaces.length) {
			allowedSpaces.forEach((spaceId) => spaceIds.push(spaceId));
		}

		const [spaceBenefits, benefitCount, termsUrlMap] = await Promise.all([
			this.prisma.spaceBenefit.findMany({
				where: {
					level: {
						in: benefitLevels,
					},
					active: true,
					...(spaceIds.length && {
						spaceId: {
							in: spaceIds,
						},
					}),
					...(nftInstance?.nftCollection.category && {
						space: {
							category: nftInstance.nftCollection.category,
						},
					}),
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
							category: true,
						},
					},
					SpaceBenefitUsage: {
						select: {
							createdAt: true,
							tokenAddress: true,
						},
						where: {
							userId: authContext.userId,
						},
						orderBy: {
							createdAt: 'desc',
						},
					},
				},
			}),
			this.prisma.spaceBenefit.count({
				where: {
					level: {
						in: benefitLevels,
					},
					active: true,
					...(spaceId && {
						spaceId,
					}),
					...(!spaceId &&
						allowedSpaces.length && {
							spaceId: {
								in: allowedSpaces,
							},
						}),
					...(nftInstance?.nftCollection.category && {
						space: {
							category: nftInstance.nftCollection.category,
						},
					}),
					...(!nftInstance?.nftCollection.category && {
						space: {
							category: {
								not: SpaceCategory.WALKERHILL,
							},
						},
					}),
				},
			}),
			this.getNftTermsUrls(),
		]);

		const sortedSpaceBenefits =
			spaceIds.length > 1
				? spaceBenefits.sort((benefitA, benefitB) =>
						spaceIds.indexOf(benefitA.space.id) >
						spaceIds.indexOf(benefitB.space.id)
							? 1
							: -1,
					)
				: spaceBenefits;

		return {
			benefits: sortedSpaceBenefits.map(
				({ space, SpaceBenefitUsage, ...rest }) => {
					let used = false;
					let state = BenefitState.AVAILABLE;
					if (SpaceBenefitUsage.length) {
						if (rest.singleUse) {
							used = true;
							state = SpaceBenefitUsage.find(
								(benefitUsage) =>
									benefitUsage.tokenAddress === tokenAddress,
							)
								? BenefitState.USED
								: BenefitState.UNAVAILABLE;
						} else {
							used = SpaceBenefitUsage.some(
								(benefitUsage) =>
									benefitUsage.tokenAddress ===
										tokenAddress &&
									benefitUsage.createdAt >
										benefitUsageResetTime(),
							);
							if (used) {
								state = BenefitState.USED;
							}
						}
					}

					return {
						...rest,
						spaceId: space.id,
						spaceName: space.name,
						category: space.category,
						spaceImage: this.mediaService.getUrl(space.image),
						used,
						state,
						tokenAddress,
						nftCollectionName:
							nftInstance.name ||
							nftInstance.nftCollection?.name ||
							'',
						nftCollectionImage:
							nftInstance.imageUrl ||
							nftInstance.nftCollection.collectionLogo ||
							'',
						nftCollectionVideo: nftInstance.videoUrl,
						nftCollectionChain: nftInstance.nftCollection.chain,
						termsUrl: termsUrlMap[tokenAddress]?.spaceIds?.includes(
							space.id,
						)
							? termsUrlMap[tokenAddress].termsUrl
							: null,
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
			// TODO: implement this
			return {
				network: tokenData.chain,
				holderCount: '0',
				floorPrice: '0.00',
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
			floorPrice: lowestPrice?.result.price.ether || '0',
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
		const maxDistance = (await this.systemConfig.get())
			.maxDistanceFromSpace;
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
				name: nftMember.user.nickName || '',
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
					communityRank: 'asc',
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

	async getNftTermsUrls() {
		const cacheKey = 'NFT_TERMS_URLS';

		const cachedData =
			await this.cacheManager.get<
				Record<string, { termsUrl: string; spaceIds: string[] }>
			>(cacheKey);
		if (cachedData && Object.keys(cachedData).length) {
			return cachedData;
		}

		const systemNftsWithTerms =
			await this.prisma.systemNftCollection.findMany({
				where: {
					termsUrl: {
						not: null,
					},
				},
				select: {
					tokenAddress: true,
					termsUrl: true,
					spaceId: true,
					SystemNftCollectionSpace: {
						select: {
							SpaceId: true,
						},
					},
				},
			});

		const urlMap: Record<string, { termsUrl: string; spaceIds: string[] }> =
			{};
		for (const nft of systemNftsWithTerms) {
			const spaceIds = nft.SystemNftCollectionSpace.map(
				(space) => space.SpaceId!,
			);
			if (nft.spaceId && !spaceIds.includes(nft.spaceId)) {
				spaceIds.push(nft.spaceId);
			}
			urlMap[nft.tokenAddress] = { termsUrl: nft.termsUrl!, spaceIds };
		}

		await this.cacheManager.set(
			cacheKey,
			urlMap,
			CACHE_TTL.FIVE_MIN_IN_MILLISECONDS,
		);

		return urlMap;
	}
}
