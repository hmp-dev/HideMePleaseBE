import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	Inject,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { BenefitLevel } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { addSeconds } from 'date-fns';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class NftLevelService {
	constructor(
		private prisma: PrismaService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

	private async getBenefitLevel(points: number): Promise<BenefitLevel> {
		const cacheKey = 'BENEFIT_LEVEL_POINT_CAP_2';

		const cachedData = (await this.cacheManager.get(cacheKey)) as {
			expiry: Date;
			pointCaps: {
				level: BenefitLevel;
				pointCap: number;
			}[];
		};

		const pointMap = {
			LEVEL1: 100,
			LEVEL2: 200,
			LEVEL3: 300,
			LEVEL4: 400,
			LEVEL5: 999999,
			LEVEL_NFT: Infinity,
		} satisfies Record<BenefitLevel, number>;

		if (cachedData && new Date(cachedData.expiry) > new Date()) {
			cachedData.pointCaps.forEach(
				(cap) => (pointMap[cap.level] = cap.pointCap),
			);
		} else {
			const pointCaps = await this.prisma.benefitLevelPointCap.findMany({
				select: {
					level: true,
					pointCap: true,
				},
			});

			await this.cacheManager.set(cacheKey, {
				pointCaps,
				expiry: addSeconds(new Date(), 60),
			});

			pointCaps.forEach((cap) => (pointMap[cap.level] = cap.pointCap));
		}

		if (points <= pointMap[BenefitLevel.LEVEL1]) {
			return BenefitLevel.LEVEL1;
		} else if (points <= pointMap[BenefitLevel.LEVEL2]) {
			return BenefitLevel.LEVEL2;
		} else if (points <= pointMap[BenefitLevel.LEVEL3]) {
			return BenefitLevel.LEVEL3;
		} else if (points <= pointMap[BenefitLevel.LEVEL4]) {
			return BenefitLevel.LEVEL4;
		} else if (points <= pointMap[BenefitLevel.LEVEL5]) {
			return BenefitLevel.LEVEL5;
		}

		throw new InternalServerErrorException(ErrorCodes.UNHANDLED_ERROR);
	}

	async getAllEligibleLevels(points: number) {
		const benefitLevel = await this.getBenefitLevel(points);

		switch (benefitLevel) {
			case BenefitLevel.LEVEL1:
				return [BenefitLevel.LEVEL1];
			case BenefitLevel.LEVEL2:
				return [BenefitLevel.LEVEL2];
			case BenefitLevel.LEVEL3:
				return [BenefitLevel.LEVEL3];
			case BenefitLevel.LEVEL4:
				return [BenefitLevel.LEVEL4];
			case BenefitLevel.LEVEL5:
				return [BenefitLevel.LEVEL5];
		}
	}
}
