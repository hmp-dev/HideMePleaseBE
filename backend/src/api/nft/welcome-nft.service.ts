import { BadRequestException, Injectable } from '@nestjs/common';

import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class WelcomeNftService {
	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
	) {}

	async getWelcomeNft() {
		const [welcomeNft, totalCount, usedCount] = await Promise.all([
			this.prisma.welcomeNft.findFirst({
				select: {
					id: true,
					image: true,
				},
				where: {
					used: false,
				},
				orderBy: {
					createdAt: 'asc',
				},
			}),
			this.prisma.welcomeNft.count(),
			this.prisma.welcomeNft.count({
				where: {
					used: true,
				},
			}),
		]);
		if (!welcomeNft) {
			throw new BadRequestException(ErrorCodes.MISSING_WELCOME_NFT);
		}
		return {
			...welcomeNft,
			totalCount,
			usedCount,
			image: this.mediaService.getUrl(welcomeNft.image),
		};
	}

	async consumeWelcomeNft({
		request,
		welcomeNftId,
	}: {
		request: Request;
		welcomeNftId: number;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const welcomeNft = await this.prisma.welcomeNft.findFirst({
			where: {
				id: welcomeNftId,
				used: false,
			},
			select: {
				id: true,
				siteLink: true,
			},
		});

		if (!welcomeNft) {
			// This might be used by the time user made this api call, let's try to find something else
			const newWelcomeNft = await this.prisma.welcomeNft.findFirst({
				select: {
					id: true,
					siteLink: true,
				},
				where: {
					used: false,
				},
				orderBy: {
					createdAt: 'asc',
				},
			});
			if (!newWelcomeNft) {
				// all are consumed
				throw new BadRequestException(ErrorCodes.MISSING_WELCOME_NFT);
			}

			await this.prisma.welcomeNft.update({
				where: {
					id: newWelcomeNft.id,
				},
				data: {
					used: true,
					userId: authContext.userId,
				},
			});

			return newWelcomeNft.siteLink;
		}

		await this.prisma.welcomeNft.update({
			where: {
				id: welcomeNft.id,
			},
			data: {
				used: true,
				userId: authContext.userId,
			},
		});

		return welcomeNft.siteLink;
	}
}
