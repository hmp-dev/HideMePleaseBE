import { Injectable } from '@nestjs/common';
import { isSameDay } from 'date-fns';

import { getBenefitLevel } from '@/api/nft/nft.utils';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class NftBenefitsService {
	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
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
}
