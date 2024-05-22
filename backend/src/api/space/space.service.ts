import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SpaceCategory } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { addMinutes, isSameDay, subDays } from 'date-fns';
import { validate as isValidUUID } from 'uuid';

import { NftBenefitsService } from '@/api/nft/nft-benefits.service';
import { NftPointService } from '@/api/nft/nft-point.service';
import {
	DEFAULT_POINTS,
	SPACE_LIST_PAGE_SIZE,
} from '@/api/space/space.constants';
import { RedeemBenefitsDTO } from '@/api/space/space.dto';
import { DecodedBenefitToken } from '@/api/space/space.types';
import { CACHE_TTL, SPACE_TOKEN_VALIDITY_IN_MINUTES } from '@/constants';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext, JwtType } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class SpaceService {
	private logger = new Logger(SpaceService.name);

	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
		private nftPointService: NftPointService,
		private mediaService: MediaService,
		private nftBenefitsService: NftBenefitsService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

	generateBenefitsToken({
		spaceId,
		request,
	}: {
		request: Request;
		spaceId: string;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const token: DecodedBenefitToken = {
			type: JwtType.SPACE_BENEFIT,
			spaceId,
			generatedAt: new Date(),
			validTill: addMinutes(new Date(), SPACE_TOKEN_VALIDITY_IN_MINUTES),
			generatedBy: authContext.userId,
		};

		return this.jwtService.signAsync(token);
	}

	async generateBenefitsTokenBackdoor({
		spaceId,
		request,
	}: {
		spaceId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const spaceUser = await this.prisma.spaceUser.findFirst({
			where: {
				spaceId,
			},
			select: {
				userId: true,
			},
		});

		const token: DecodedBenefitToken = {
			type: JwtType.SPACE_BENEFIT,
			spaceId,
			generatedAt: new Date(),
			validTill: addMinutes(new Date(), SPACE_TOKEN_VALIDITY_IN_MINUTES),
			generatedBy: spaceUser?.userId || authContext.userId,
		};

		return this.jwtService.signAsync(token);
	}

	async redeemBenefit({
		redeemBenefitsDTO,
		benefitId,
		request,
	}: {
		request: Request;
		benefitId: string;
		redeemBenefitsDTO: RedeemBenefitsDTO;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const decodedToken = (await this.jwtService.verifyAsync(
			redeemBenefitsDTO.token,
		)) as unknown as DecodedBenefitToken;

		if (new Date(decodedToken.validTill) < new Date()) {
			throw new BadRequestException(ErrorCodes.BENEFIT_TOKEN_EXPIRED);
		}
		if (!isValidUUID(benefitId)) {
			throw new BadRequestException(ErrorCodes.INVALID_BENEFIT_ID);
		}

		const benefit = await this.prisma.spaceBenefit.findFirst({
			where: {
				id: benefitId,
				spaceId: decodedToken.spaceId,
				active: true,
			},
		});

		if (!benefit) {
			throw new BadRequestException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		if (benefit.singleUse) {
			const alreadyUsedBenefit =
				await this.prisma.spaceBenefitUsage.findFirst({
					where: {
						benefitId,
						userId: authContext.userId,
					},
					select: {
						createdAt: true,
					},
				});
			if (alreadyUsedBenefit) {
				throw new BadRequestException(
					ErrorCodes.SINGLE_USE_BENEFIT_USED,
				);
			}
		} else {
			const lastUsedBenefit =
				await this.prisma.spaceBenefitUsage.findFirst({
					where: {
						benefitId,
						userId: authContext.userId,
						tokenAddress: redeemBenefitsDTO.tokenAddress,
					},
					select: {
						createdAt: true,
					},
					orderBy: {
						createdAt: 'desc',
					},
				});

			if (
				lastUsedBenefit &&
				isSameDay(lastUsedBenefit.createdAt, new Date())
			) {
				throw new BadRequestException(
					ErrorCodes.BENEFIT_ALREADY_USED_TODAY,
				);
			}
		}

		await this.prisma.spaceBenefitUsage.create({
			data: {
				benefitId,
				userId: authContext.userId,
				tokenAddress: redeemBenefitsDTO.tokenAddress,
				pointsEarned: DEFAULT_POINTS.VISIT_SPACE,
				verifierUserId: decodedToken.generatedBy,
			},
		});

		void this.nftPointService
			.recalculateNftCollectionPoints()
			.then(() => this.logger.log('Recalculation of points done'))
			.catch((e) => this.logger.log(`Error in recalculate points: ${e}`));

		void this.nftPointService
			.recalculateNftCollectionUserPoints(redeemBenefitsDTO.tokenAddress)
			.then(() => this.logger.log('Recalculation of user points done'))
			.catch((e) =>
				this.logger.log(`Error in recalculate user points: ${e}`),
			);
	}

	async getSpaceList({
		category,
		page,
	}: {
		request: Request;
		category: SpaceCategory;
		page: number;
	}) {
		const currentPage = isNaN(page) || !page ? 1 : page;

		const mostPointsSpace = await this.getSpaceWithMostPointsInLastWeek();

		const spaces = await this.prisma.space.findMany({
			where: {
				category,
			},
			select: {
				id: true,
				name: true,
				image: true,
				category: true,
				SpaceBenefit: {
					select: {
						description: true,
					},
					where: {
						isRepresentative: true,
					},
					take: 1,
				},
			},
			take: Number(SPACE_LIST_PAGE_SIZE),
			skip: Number(SPACE_LIST_PAGE_SIZE) * (currentPage - 1),
		});

		return spaces.map(({ SpaceBenefit, ...rest }) => ({
			...rest,
			benefitDescription: SpaceBenefit[0]?.description,
			image: this.mediaService.getUrl(rest.image),
			hidingCount: 0, // TODO: Update logic
			hot: mostPointsSpace?.spaceId === rest.id,
			hotPoints:
				mostPointsSpace?.spaceId === rest.id
					? mostPointsSpace?.points
					: undefined,
		}));
	}

	async getSpace({ spaceId }: { request: Request; spaceId: string }) {
		const space = await this.prisma.space.findFirst({
			where: {
				id: spaceId,
			},
			select: {
				name: true,
				latitude: true,
				longitude: true,
				address: true,
				businessHoursStart: true,
				businessHoursEnd: true,
				category: true,
				introduction: true,
				locationDescription: true,
				image: true,
			},
		});
		if (!space) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		return {
			...space,
			image: this.mediaService.getUrl(space.image),
		};
	}

	async getSpaceBenefits({
		request,
		spaceId,
		next,
	}: {
		request: Request;
		spaceId: string;
		next?: string;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const userNfts = await this.prisma.nftCollection.findMany({
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
		if (!userNfts.length) {
			return [];
		}

		const nftAddresses = userNfts.map((nft) => nft.tokenAddress);

		const nftsAfterSkip = next
			? nftAddresses.slice(nftAddresses.indexOf(next))
			: nftAddresses;

		const [currentNft, nextNft] = nftsAfterSkip;
		return {
			benefits: await this.nftBenefitsService.getCollectionBenefits({
				tokenAddress: currentNft,
				request,
				pageSize: 1000,
				spaceId,
				page: 1,
			}),
			next: nextNft ?? null,
		};
	}

	async getSpaceRecommendations() {
		const cacheKey = 'SPACE_RECOMMENDATIONS';
		const cachedRecommendations = await this.cacheManager.get(cacheKey);
		if (cachedRecommendations) {
			return cachedRecommendations;
		}

		const benefitUsages = await this.prisma.spaceBenefitUsage.findMany({
			// where: {
			// 	createdAt: {
			// 		gt: startOfDay(new Date()),
			// 	},
			// },
			select: {
				userId: true,
				pointsEarned: true,
				benefit: {
					select: {
						space: {
							select: {
								name: true,
								id: true,
							},
						},
					},
				},
			},
		});

		const spaceBenefitAggregate: Record<
			string,
			{
				spaceId: string;
				spaceName: string;
				users: Set<string>;
				points: number;
			}
		> = {};

		for (const benefitUsage of benefitUsages) {
			const { space } = benefitUsage.benefit;
			if (!spaceBenefitAggregate[space.id]) {
				spaceBenefitAggregate[space.id] = {
					spaceId: space.id,
					spaceName: space.name,
					points: 0,
					users: new Set<string>(),
				};
			}
			spaceBenefitAggregate[space.id].points += benefitUsage.pointsEarned;
			spaceBenefitAggregate[space.id].users.add(benefitUsage.userId);
		}

		const spacesList = Object.values(spaceBenefitAggregate);
		spacesList.sort((spaceA, spaceB) => {
			if (spaceA.points === spaceB.points) {
				return Math.random() > 0.5 ? -1 : 1;
			}
			if (spaceA.points > spaceB.points) {
				return -1;
			}

			return 1;
		});

		const recommendations = spacesList.map(
			({ spaceId, spaceName, users }) => ({
				spaceId,
				spaceName,
				users: users.size,
			}),
		);

		await this.cacheManager.set(
			cacheKey,
			recommendations,
			CACHE_TTL.THIRTY_MIN_IN_MILLISECONDS,
		);

		return recommendations;
	}

	async getSpaceWithMostPointsInLastWeek() {
		const cacheKey = 'SPACE_WITH_MOST_POINTS_IN_LAST_WEEK';
		const cachedSpace = await this.cacheManager.get<{
			spaceId: string;
			points: number;
		}>(cacheKey);
		if (cachedSpace) {
			return cachedSpace;
		}

		const oneWeekBefore = subDays(new Date(), 7);

		const benefitUsages = await this.prisma.spaceBenefitUsage.findMany({
			where: {
				createdAt: {
					gt: oneWeekBefore,
				},
			},
			select: {
				pointsEarned: true,
				benefit: {
					select: {
						space: {
							select: {
								id: true,
							},
						},
					},
				},
			},
		});

		const spacePoints: Record<string, number> = {};

		for (const benefitUsage of benefitUsages) {
			const { space } = benefitUsage.benefit;
			if (!spacePoints[space.id]) {
				spacePoints[space.id] = 0;
			}

			spacePoints[space.id] += benefitUsage.pointsEarned;
		}

		const spacesList = Object.entries(spacePoints).map(
			([spaceId, points]) => ({ spaceId, points }),
		);
		spacesList.sort((spaceA, spaceB) =>
			spaceA.points > spaceB.points ? -1 : 1,
		);

		const [mostPointsEarned] = spacesList;
		if (!mostPointsEarned) {
			return null;
		}

		await this.cacheManager.set(
			cacheKey,
			mostPointsEarned,
			CACHE_TTL.ONE_HOUR_IN_MILLISECONDS,
		);

		return mostPointsEarned;
	}
}
