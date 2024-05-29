import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ANNOUNCEMENTS_PAGE_SIZE } from '@/api/cms/cms.constants';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { EnvironmentVariables } from '@/utils/env';

@Injectable()
export class CmsService {
	constructor(
		private mediaService: MediaService,
		private prisma: PrismaService,
		private configService: ConfigService<EnvironmentVariables, true>,
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
		});
	}

	getPartnerProgramLink() {
		return {
			link: this.configService.get<string>('SPACE_PARTNERSHIP_FORM_LINK'),
		};
	}
}
