import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { type Cache } from 'cache-manager';
import { isSameDay } from 'date-fns';

import { BENEFIT_USAGE_PAGE_SIZE } from '@/api/nft/nft.constants';
import { BenefitUsageType } from '@/api/nft/nft.types';
import { getBenefitLevel } from '@/api/nft/nft.utils';
import { CACHE_TTL } from '@/constants';
import { MediaService } from '@/modules/media/media.service';
import { MoralisApiService } from '@/modules/moralis/moralis-api.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SupportedChainMapping } from '@/modules/web3/web3.constants';
import { AuthContext, SortOrder } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class NftBenefitsService {
	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
		private moralisApiService: MoralisApiService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

	async getCollectionBenefits({
		tokenAddress,
		request,
	}: {
		request: Request;
		tokenAddress: string;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const collectionPoints = await this.getCollectionPoints(tokenAddress);
		const benefitLevel = getBenefitLevel(collectionPoints);

		const spaceBenefits = await this.prisma.spaceBenefit.findMany({
			where: {
				level: benefitLevel,
				active: true,
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
					select: { createdAt: true },
					where: {
						userId: authContext.userId,
					},
					orderBy: {
						createdAt: 'desc',
					},
					take: 1,
				},
			},
		});

		return spaceBenefits.map(({ space, SpaceBenefitUsage, ...rest }) => {
			const [spaceBenefitUsage] = SpaceBenefitUsage;
			let used = false;
			if (spaceBenefitUsage) {
				used = rest.singleUse
					? true
					: isSameDay(spaceBenefitUsage.createdAt, new Date());
			}

			return {
				...rest,
				spaceId: space.id,
				spaceName: space.name,
				spaceImage: this.mediaService.getUrl(space.image),
				used,
			};
		});
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

		const spaceBenefitUsages = await this.prisma.spaceBenefitUsage.findMany(
			{
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
			},
		);

		return spaceBenefitUsages.map((spaceBenefit) => ({
			...spaceBenefit,
			benefit: undefined,
			spaceName: spaceBenefit.benefit.space.name,
			benefitDescription: spaceBenefit.benefit.description,
			type: BenefitUsageType.SPACE_VISIT,
		}));
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
		};
		await this.cacheManager.set(
			cacheKey,
			res,
			CACHE_TTL.THIRTY_MIN_IN_MILLISECONDS,
		);

		return res;
	}
}
