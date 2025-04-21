import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
	Inject,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';

import { CACHE_TTL } from '@/constants';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { ErrorCodes } from '@/utils/errorCodes';

import { MediaService } from '../media/media.service';

interface SystemConfigRes {
	settingsBannerLink: string | null;
	settingsBannerHeading: string | null;
	settingsBannerDescription: string | null;
	settingsBannerHeadingEn: string | null;
	settingsBannerDescriptionEn: string | null;
	modalBannerImageUrl: string | undefined;
	modalBannerStartDate: Date | null;
	modalBannerEndDate: Date | null;
	maxDistanceFromSpace: number;
}

@Injectable()
export class SystemConfigService {
	constructor(
		private mediaService: MediaService,
		private prisma: PrismaService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

	private cacheKey() {
		return 'SYSTEM_CONFIG';
	}

	async get(): Promise<SystemConfigRes> {
		const cacheKey = this.cacheKey();
		const cachedConfig =
			await this.cacheManager.get<SystemConfigRes>(cacheKey);
		if (cachedConfig) {
			return cachedConfig;
		}

		const systemConfig = await this.prisma.systemConfig.findFirst({
			select: {
				settingsBannerLink: true,
				settingsBannerHeading: true,
				settingsBannerDescription: true,
				settingsBannerHeadingEn: true,
				settingsBannerDescriptionEn: true,
				modalBannerImage: true,
				modalBannerStartDate: true,
				modalBannerEndDate: true,
				maxDistanceFromSpace: true,
			},
		});

		if (!systemConfig) {
			throw new InternalServerErrorException(
				ErrorCodes.MISSING_SYSTEM_CONFIG,
			);
		}

		const modalBannerImageUrl = this.mediaService.getUrl(
			systemConfig.modalBannerImage,
		);
		const { modalBannerImage: _, ...rest } = systemConfig;
		const systemConfigResolved = { modalBannerImageUrl, ...rest };

		await this.cacheManager.set(
			cacheKey,
			systemConfigResolved,
			CACHE_TTL.FIVE_MIN_IN_MILLISECONDS,
		);

		return systemConfigResolved;
	}
}
