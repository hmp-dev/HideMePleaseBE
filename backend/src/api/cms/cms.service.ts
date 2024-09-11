import { Injectable } from '@nestjs/common';

import { ANNOUNCEMENTS_PAGE_SIZE } from '@/api/cms/cms.constants';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SystemConfigService } from '@/modules/system-config/system-config.service';

@Injectable()
export class CmsService {
	constructor(
		private mediaService: MediaService,
		private prisma: PrismaService,
		private systemConfig: SystemConfigService,
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
		const {
			settingsBannerLink,
			settingsBannerDescription,
			settingsBannerHeading,
		} = await this.systemConfig.get();

		return {
			settingsBannerLink,
			settingsBannerDescription,
			settingsBannerHeading,
		};
	}

	async getModalBanner() {
		const {
			modalBannerImageUrl,
			modalBannerStartDate,
			modalBannerEndDate,
		} = await this.systemConfig.get();
		return {
			image: modalBannerImageUrl,
			startDate: modalBannerStartDate,
			endDate: modalBannerEndDate,
		};
	}

	async getTopUsers(props: { startDate?: string }) {
		const startDate = props.startDate ? new Date(props.startDate) : null;
		const topUsers = await this.prisma.spaceBenefitUsage.groupBy({
			by: 'userId',
			_sum: {
				pointsEarned: true,
			},
			...(startDate && {
				where: {
					createdAt: {
						gte: startDate,
					},
				},
			}),
			orderBy: {
				_sum: {
					pointsEarned: 'desc',
				},
			},
		});

		const userNames = await this.prisma.user.findMany({
			where: {
				id: {
					in: topUsers.map((user) => user.userId),
				},
			},
			select: {
				id: true,
				nickName: true,
			},
		});

		const nameIdMapping: Record<string, string> = {};
		for (const user of userNames) {
			nameIdMapping[user.id] = user.nickName || '';
		}

		return topUsers.map((topUser) => ({
			name: nameIdMapping[topUser.userId],
			totalPoints: topUser._sum.pointsEarned,
			userId: topUser.userId,
		}));
	}

	async getTopNfts(props: { startDate?: string }) {
		const startDate = props.startDate ? new Date(props.startDate) : null;
		const topNfts = await this.prisma.spaceBenefitUsage.groupBy({
			by: 'tokenAddress',
			_sum: {
				pointsEarned: true,
			},
			...(startDate && {
				where: {
					createdAt: {
						gte: startDate,
					},
				},
			}),
			orderBy: {
				_sum: {
					pointsEarned: 'desc',
				},
			},
		});

		const tokenNames = await this.prisma.nftCollection.findMany({
			where: {
				tokenAddress: {
					in: topNfts.map((space) => space.tokenAddress),
				},
			},
			select: {
				tokenAddress: true,
				name: true,
			},
		});

		const nameIdMapping: Record<string, string> = {};
		for (const nft of tokenNames) {
			nameIdMapping[nft.tokenAddress] = nft.name || '';
		}

		return topNfts.map((topNft) => ({
			name: nameIdMapping[topNft.tokenAddress],
			totalPoints: topNft._sum.pointsEarned,
			tokenAddress: topNft.tokenAddress,
		}));
	}

	async getTopSpaces(props: { startDate?: string }) {
		const startDate = props.startDate ? new Date(props.startDate) : null;

		const [topBenefits, allSpaces] = await Promise.all([
			this.prisma.spaceBenefitUsage.groupBy({
				by: 'benefitId',
				_sum: {
					pointsEarned: true,
				},
				...(startDate && {
					where: {
						createdAt: {
							gte: startDate,
						},
					},
				}),
				orderBy: {
					_sum: {
						pointsEarned: 'desc',
					},
				},
			}),
			this.prisma.space.findMany({
				select: {
					id: true,
					name: true,
				},
			}),
		]);

		const linkedBenefits = await this.prisma.spaceBenefit.findMany({
			where: {
				id: {
					in: topBenefits.map((benefit) => benefit.benefitId),
				},
			},
			select: {
				id: true,
				spaceId: true,
			},
		});

		const benefitSpaceMapping: Record<string, string> = {};
		for (const benefit of linkedBenefits) {
			benefitSpaceMapping[benefit.id] = benefit.spaceId;
		}

		const spacePointAggregates: Record<
			string,
			{ name: string; totalPoints: number; spaceId: string }
		> = {};
		for (const space of allSpaces) {
			spacePointAggregates[space.id] = {
				spaceId: space.id,
				name: space.name,
				totalPoints: 0,
			};
		}

		for (const benefit of topBenefits) {
			const spaceId = benefitSpaceMapping[benefit.benefitId];
			if (!benefit._sum.pointsEarned) {
				continue;
			}
			spacePointAggregates[spaceId].totalPoints +=
				benefit._sum.pointsEarned;
		}

		return Object.values(spacePointAggregates).sort((spaceA, spaceB) =>
			spaceA.totalPoints < spaceB.totalPoints ? 1 : -1,
		);
	}
}
