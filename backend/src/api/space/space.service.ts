import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { addMinutes, isSameDay } from 'date-fns';
import { GeoPosition } from 'geo-position.ts';
import { validate as isValidUUID } from 'uuid';

import { NftPointService } from '@/api/nft/nft-point.service';
import { DEFAULT_POINTS } from '@/api/space/space.constants';
import { RedeemBenefitsDTO } from '@/api/space/space.dto';
import { DecodedBenefitToken } from '@/api/space/space.types';
import { SPACE_TOKEN_VALIDITY_IN_MINUTES } from '@/constants';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext, JwtType } from '@/types';
import { EnvironmentVariables } from '@/utils/env';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class SpaceService {
	private logger = new Logger(SpaceService.name);

	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
		private configService: ConfigService<EnvironmentVariables, true>,
		private jwtService: JwtService,
		private nftPointService: NftPointService,
	) {}

	async getNearestSpaces({
		latitude,
		longitude,
	}: {
		request: Request;
		latitude: number;
		longitude: number;
	}) {
		const userPosition = new GeoPosition(latitude, longitude);

		const spaces = await this.prisma.space.findMany({
			select: {
				id: true,
				name: true,
				latitude: true,
				longitude: true,
				address: true,
				image: true,
			},
		});

		const maxDistance = this.configService.get<number>(
			'MAX_DISTANCE_FROM_SPACE',
		);

		const spacesWithDistance = spaces.map((space) => {
			const spacePosition = new GeoPosition(
				space.latitude,
				space.longitude,
			);

			return {
				...space,
				image: this.mediaService.getUrl(space.image),
				distance: Number(
					userPosition.Distance(spacePosition).toFixed(0),
				),
			};
		});

		return spacesWithDistance
			.filter((space) => space.distance <= maxDistance)
			.sort((spaceA, spaceB) =>
				spaceA.distance > spaceB.distance ? 1 : -1,
			);
	}

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
	}
}
