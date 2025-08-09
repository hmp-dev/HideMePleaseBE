import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	BadRequestException,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { SpaceCategory } from '@prisma/client';
import { PromisePool } from '@supercharge/promise-pool';
import type { Cache } from 'cache-manager';
import { startOfDay, subDays } from 'date-fns';
import { GeoPosition } from 'geo-position.ts';
import { validate as isValidUUID } from 'uuid';

import { BenefitState } from '@/api/nft/nft.types';
import { NftBenefitsService } from '@/api/nft/nft-benefits.service';
import { NftPointService } from '@/api/nft/nft-point.service';
import {
	DEFAULT_POINTS,
	SPACE_LIST_PAGE_SIZE,
	SPACE_ONBOARDING_EXPOSURE_TIME_IN_DAYS,
} from '@/api/space/space.constants';
import { RedeemBenefitsDTO } from '@/api/space/space.dto';
import { SpaceLocationService } from '@/api/space/space-location.service';
import { UserLocationService } from '@/api/users/user-location.service';
import { CACHE_TTL } from '@/constants';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SystemConfigService } from '@/modules/system-config/system-config.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';
import { benefitUsageResetTime } from '@/utils/time';

import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification.types';

@Injectable()
export class SpaceService {
	private logger = new Logger(SpaceService.name);

	constructor(
		private prisma: PrismaService,
		private nftPointService: NftPointService,
		private mediaService: MediaService,
		private nftBenefitsService: NftBenefitsService,
		private userLocationService: UserLocationService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
		private systemConfig: SystemConfigService,
		private spaceLocationService: SpaceLocationService,
		private notificationService: NotificationService,
	) {}

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
		if (!isValidUUID(benefitId)) {
			throw new BadRequestException(ErrorCodes.INVALID_BENEFIT_ID);
		}
		if (!isValidUUID(redeemBenefitsDTO.spaceId)) {
			throw new BadRequestException(ErrorCodes.INVALID_SPACE_ID);
		}

		const benefit = await this.prisma.spaceBenefit.findFirst({
			where: {
				id: benefitId,
				spaceId: redeemBenefitsDTO.spaceId,
				active: true,
			},
			include: {
				space: true,
			},
		});
		if (!benefit) {
			throw new BadRequestException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		const userPosition = new GeoPosition(
			redeemBenefitsDTO.latitude,
			redeemBenefitsDTO.longitude,
		);
		const spacePosition = new GeoPosition(
			benefit.space.latitude,
			benefit.space.longitude,
		);
		const maxDistance = (await this.systemConfig.get())
			.maxDistanceFromSpace;
		const spaceDistance = Number(
			userPosition.Distance(spacePosition).toFixed(0),
		);
		if (spaceDistance > maxDistance) {
			throw new BadRequestException(ErrorCodes.SPACE_OUT_OF_RANGE);
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
				lastUsedBenefit.createdAt > benefitUsageResetTime()
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
			},
		});

		if (benefit.space.category === SpaceCategory.WALKERHILL) {
			void this.notificationService.sendNotification({
				type: NotificationType.Admin,
				userId: authContext.userId,
				title: '워커힐 혜택 사용알림',
				body: '비밀 열쇠 1개를 획득하였습니다.',
			});
		}

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
		latitude,
		longitude,
	}: {
		request: Request;
		category: SpaceCategory;
		page: number;
		latitude: number;
		longitude: number;
	}) {
		const currentPage = isNaN(page) || !page ? 1 : Number(page);

		const mostPointsSpace = await this.getSpaceWithMostPointsInLastWeek();

		let sortedSpaceIds =
			await this.spaceLocationService.getSpacesSortedByLocation({
				latitude,
				longitude,
			});

		// Hottest space should be at top
		if (mostPointsSpace?.spaceId) {
			sortedSpaceIds = sortedSpaceIds.filter(
				(spaceId) => spaceId !== mostPointsSpace.spaceId,
			);
			sortedSpaceIds.unshift(mostPointsSpace.spaceId);
		}

		const spaces = await this.prisma.space.findMany({
			where: {
				category,
				id: {
					in: sortedSpaceIds,
				},
			},
			select: {
				id: true,
				name: true,
				nameEn: true,
				image: {
					select: {
						id: true,
						filename_download: true,
						filename_disk: true,
					},
				},
				category: true,
				latitude: true,
				longitude: true,
				isTemporarilyClosed: true,
				temporaryClosureReason: true,
				temporaryClosureEndDate: true,
				SpaceBenefit: {
					select: {
						description: true,
					},
					where: {
						isRepresentative: true,
					},
					take: 1,
				},
				SpaceBusinessHours: {
					select: {
						dayOfWeek: true,
						openTime: true,
						closeTime: true,
						breakStartTime: true,
						breakEndTime: true,
						isClosed: true,
					},
					orderBy: {
						dayOfWeek: 'asc',
					},
				},
				SpaceEventCategory: {
					select: {
						eventCategory: {
							select: {
								id: true,
								name: true,
								nameEn: true,
								colorCode: true,
								iconUrl: true,
							},
						},
					},
				},
			},
		});

		// page가 999이면 전체 데이터 반환
		let sortedSpaces;
		if (currentPage === 999) {
			sortedSpaces = spaces.sort((spaceA, spaceB) =>
				sortedSpaceIds.indexOf(spaceA.id) >
				sortedSpaceIds.indexOf(spaceB.id)
					? 1
					: -1,
			);
		} else {
			const skip = SPACE_LIST_PAGE_SIZE * (currentPage - 1);
			if (skip >= spaces.length) {
				return [];
			}

			sortedSpaces = spaces
				.sort((spaceA, spaceB) =>
					sortedSpaceIds.indexOf(spaceA.id) >
					sortedSpaceIds.indexOf(spaceB.id)
						? 1
						: -1,
				)
				.slice(skip, SPACE_LIST_PAGE_SIZE + skip);
		}

		const hidingUsers =
			await this.userLocationService.getNumberOfUsersHidingInSpaces(
				sortedSpaces.map((space) => space.id),
			);

		return sortedSpaces.map(({ SpaceBenefit, SpaceEventCategory, ...rest }) => ({
			...rest,
			SpaceEventCategory,
			benefitDescription: SpaceBenefit[0]?.description,
			image: rest.image ? this.mediaService.getUrl(rest.image as any) : null,
			hidingCount: hidingUsers[rest.id],
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
				id: true,
				name: true,
				nameEn: true,
				latitude: true,
				longitude: true,
				address: true,
				addressEn: true,
				businessHoursStart: true,
				businessHoursEnd: true,
				category: true,
				introduction: true,
				introductionEn: true,
				locationDescription: true,
				image: {
					select: {
						id: true,
						filename_download: true,
						filename_disk: true,
					},
				},
				isTemporarilyClosed: true,
				SpaceEventCategory: {
					select: {
						eventCategory: {
							select: {
								id: true,
								name: true,
								nameEn: true,
								colorCode: true,
								iconUrl: true,
							},
						},
					},
				},
				temporaryClosureReason: true,
				temporaryClosureEndDate: true,
				SpaceBusinessHours: {
					select: {
						dayOfWeek: true,
						openTime: true,
						closeTime: true,
						breakStartTime: true,
						breakEndTime: true,
						isClosed: true,
					},
					orderBy: {
						dayOfWeek: 'asc',
					},
				},
			},
		});
		if (!space) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}
		const hidingUsers =
			await this.userLocationService.getNumberOfUsersHidingInSpaces([
				spaceId,
			]);

		const spaceOpenTime = new Date();
		spaceOpenTime.setHours(Number(space.businessHoursStart.split(':')[0]));
		spaceOpenTime.setMinutes(
			Number(space.businessHoursStart.split(':')[1]),
		);
		spaceOpenTime.setSeconds(0);

		const spaceCloseTime = new Date();
		spaceCloseTime.setHours(Number(space.businessHoursEnd.split(':')[0]));
		spaceCloseTime.setMinutes(Number(space.businessHoursEnd.split(':')[1]));
		spaceCloseTime.setSeconds(0);

		const now = new Date();
		const spaceOpen = now > spaceOpenTime && now < spaceCloseTime;

		return {
			...space,
			hidingCount: hidingUsers[spaceId],
			image: space.image ? this.mediaService.getUrl(space.image as any) : null,
			spaceOpen,
		};
	}

	async getSpaceBenefits({
		request,
		spaceId,
	}: {
		request: Request;
		spaceId: string;
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
			const allSpaceBenefits = await this.prisma.spaceBenefit.findMany({
				where: {
					spaceId,
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
							image: {
					select: {
						id: true,
						filename_download: true,
						filename_disk: true,
					},
				},
						},
					},
				},
			});

			return {
				benefits: allSpaceBenefits.map(({ space, ...benefit }) => ({
					...benefit,
					spaceId,
					spaceName: space.name,
					spaceImage: space.image ? this.mediaService.getUrl(space.image as any) : null,
					used: true,
					state: BenefitState.UNAVAILABLE,
					tokenAddress: null,
					nftCollectionName: space.name, // no nfts linked here
				})),
				benefitCount: allSpaceBenefits.length,
			};
		}

		const nftAddresses = userNfts.map((nft) => nft.tokenAddress);

		const { errors, results } = await PromisePool.withConcurrency(4)
			.for(nftAddresses)
			.process(async (tokenAddress) => {
				// This api will auto filter category based nfts too
				return await this.nftBenefitsService.getCollectionBenefits({
					tokenAddress,
					request,
					pageSize: 1000,
					spaceId,
					page: 1,
				});
			});

		if (errors.length) {
			throw new InternalServerErrorException(ErrorCodes.UNHANDLED_ERROR);
		}

		const benefits = results.map((benefit) => benefit.benefits).flat(1);

		return {
			benefits: benefits,
			benefitCount: benefits.length,
		};
	}

	async getSpaceRecommendations() {
		const cacheKey = 'SPACE_RECOMMENDATIONS';
		const cachedRecommendations = await this.cacheManager.get(cacheKey);
		if (cachedRecommendations) {
			return cachedRecommendations;
		}

		const benefitUsages = await this.prisma.spaceBenefitUsage.findMany({
			where: {
				createdAt: {
					gt: startOfDay(new Date()),
				},
			},
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

	async getNewSpaces() {
		const newSpaces = await this.prisma.space.findMany({
			where: {
				createdAt: {
					gte: subDays(
						new Date(),
						SPACE_ONBOARDING_EXPOSURE_TIME_IN_DAYS,
					),
				},
			},
			select: {
				id: true,
				name: true,
				nameEn: true,
				image: {
					select: {
						id: true,
						filename_download: true,
						filename_disk: true,
					},
				},
				isTemporarilyClosed: true,
				temporaryClosureReason: true,
				temporaryClosureEndDate: true,
				SpaceBenefit: {
					select: {
						description: true,
						isRepresentative: true,
					},
					orderBy: {
						isRepresentative: 'desc',
					},
				},
				SpaceBusinessHours: {
					select: {
						dayOfWeek: true,
						openTime: true,
						closeTime: true,
						breakStartTime: true,
						breakEndTime: true,
						isClosed: true,
					},
					orderBy: {
						dayOfWeek: 'asc',
					},
				},
				SpaceEventCategory: {
					select: {
						eventCategory: {
							select: {
								id: true,
								name: true,
								nameEn: true,
								colorCode: true,
								iconUrl: true,
							},
						},
					},
				},
			},
		});

		const hidingUsers =
			await this.userLocationService.getNumberOfUsersHidingInSpaces(
				newSpaces.map((space) => space.id),
			);

		return newSpaces.map(({ SpaceBenefit, ...space }) => ({
			...space,
			image: space.image ? this.mediaService.getUrl(space.image as any) : null,
			mainBenefitDescription: SpaceBenefit[0]?.description,
			remainingBenefitCount: SpaceBenefit.length
				? SpaceBenefit.length - 1
				: SpaceBenefit.length,
			hidingCount: hidingUsers[space.id],
		}));
	}
}
