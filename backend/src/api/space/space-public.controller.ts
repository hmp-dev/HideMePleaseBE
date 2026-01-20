import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

@ApiTags('Space Public')
@Controller('space')
export class SpacePublicController {
	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
	) {}

	@ApiOperation({
		summary: 'Get all spaces (public)',
		description: '전체 매장 목록을 조회합니다. 인증 불필요.',
	})
	@Get('public')
	async getAllSpaces() {
		const spaces = await this.prisma.space.findMany({
			where: {
				storeStatus: 'APPROVED',
			},
			select: {
				id: true,
				name: true,
				nameEn: true,
				address: true,
				addressEn: true,
				latitude: true,
				longitude: true,
				category: true,
				businessHoursStart: true,
				businessHoursEnd: true,
				introduction: true,
				introductionEn: true,
				locationDescription: true,
				maxCheckInCapacity: true,
				isTemporarilyClosed: true,
				temporaryClosureReason: true,
				temporaryClosureEndDate: true,
				createdAt: true,
				image: {
					select: {
						id: true,
						filename_download: true,
						filename_disk: true,
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
			orderBy: {
				name: 'asc',
			},
		});

		return spaces.map((space) => ({
			...space,
			image: space.image ? this.mediaService.getUrl(space.image as any) : null,
		}));
	}
}
