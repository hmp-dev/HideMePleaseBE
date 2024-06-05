import { Injectable } from '@nestjs/common';

import { ANNOUNCEMENTS_PAGE_SIZE } from '@/api/cms/cms.constants';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class CmsService {
	constructor(
		private mediaService: MediaService,
		private prisma: PrismaService,
	) {}

	async uploadImage({
		file,
	}: {
		request: Request;
		file: Express.Multer.File;
	}) {
		const media = await this.mediaService.uploadMedia(file);

		return this.mediaService.getUrl(media);
	}

	getAnnouncements({ page }: { page: number }) {
		const currentPage = isNaN(page) || !page ? 1 : page;

		return this.prisma.announcements.findMany({
			select: {
				id: true,
				createdAt: true,
				title: true,
				description: true,
			},
			take: ANNOUNCEMENTS_PAGE_SIZE,
			skip: ANNOUNCEMENTS_PAGE_SIZE * (currentPage - 1),
			orderBy: {
				createdAt: 'desc',
			},
		});
	}

	async getSettingsBanner() {
		const systemConfig = await this.prisma.systemConfig.findFirst({
			select: {
				settingsBannerLink: true,
				settingsBannerHeading: true,
				settingsBannerDescription: true,
			},
		});

		return {
			...systemConfig,
		};
	}
}
