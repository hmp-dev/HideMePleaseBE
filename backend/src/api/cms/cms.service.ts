import { Injectable } from '@nestjs/common';
import { subDays } from 'date-fns';

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
			settingsBannerDescriptionEn,
			settingsBannerHeading,
			settingsBannerHeadingEn,
		} = await this.systemConfig.get();

		return {
			settingsBannerLink,
			settingsBannerDescription,
			settingsBannerDescriptionEn,
			settingsBannerHeadingEn,
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

	async getNftUsageFrequency({ tokenAddress }: { tokenAddress: string }) {
		const monthAgo = subDays(new Date(), 30);
		const weekAgo = subDays(new Date(), 7);

		const [usageUsers, totalHoldingUsers] = await Promise.all([
			this.prisma.spaceBenefitUsage.findMany({
				where: {
					tokenAddress,
					createdAt: {
						gte: monthAgo,
					},
				},
				select: {
					userId: true,
					createdAt: true,
				},
			}),
			this.prisma.nft.findMany({
				where: {
					tokenAddress,
				},
				select: {
					ownedWallet: {
						select: {
							userId: true,
						},
					},
				},
			}),
		]);

		const userIds30Day = [
			...new Set(usageUsers.map((user) => user.userId)),
		];
		const userIds7Day = [
			...new Set(
				usageUsers
					.filter((usageUser) => usageUser.createdAt >= weekAgo)
					.map((user) => user.userId),
			),
		];

		const distinctHoldingUsers = [
			...new Set(
				totalHoldingUsers.map((user) => user.ownedWallet.userId),
			),
		];

		const usageFrequency7Day =
			100 * (userIds7Day.length / (distinctHoldingUsers.length || 1));
		const usageFrequency30Day =
			100 * (userIds30Day.length / (distinctHoldingUsers.length || 1));

		return {
			usageFrequency7Day: `${usageFrequency7Day.toFixed(2)} %`,
			usageFrequency30Day: `${usageFrequency30Day.toFixed(2)} %`,
		};
	}

	async getBenefitUsageForUser({
		userId,
		startDate: start,
	}: {
		userId: string;
		startDate?: string;
	}) {
		const startDate = start ? new Date(start) : null;

		const benefitUsage = await this.prisma.spaceBenefitUsage.findMany({
			where: {
				userId,
				...(startDate && {
					createdAt: {
						gte: startDate,
					},
				}),
			},
			orderBy: {
				createdAt: 'desc',
			},
			select: {
				user: {
					select: {
						id: true,
						nickName: true,
					},
				},
				benefit: {
					select: {
						id: true,
						description: true,
						space: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				createdAt: true,
				nftCollection: {
					select: {
						name: true,
						symbol: true,
						tokenAddress: true,
					},
				},
			},
		});

		return benefitUsage.map((usage) => ({
			nickName: usage.user.nickName,
			userId: usage.user.id,
			benefit: usage.benefit.description,
			benefitId: usage.benefit.id,
			space: usage.benefit.space.name,
			spaceId: usage.benefit.space.id,
			createdAt: usage.createdAt,
			nftName: usage.nftCollection.name,
			nftSymbol: usage.nftCollection.symbol,
			tokenAddress: usage.nftCollection.tokenAddress,
		}));
	}

	async getAggregateBenefitUsageForUser({ userId }: { userId: string }) {
		const benefitUsage = await this.prisma.spaceBenefitUsage.groupBy({
			by: 'benefitId',
			_sum: {
				pointsEarned: true,
			},
			where: {
				userId,
			},
		});

		const benefitPointMap: Record<string, number> = {};
		for (const benefit of benefitUsage) {
			benefitPointMap[benefit.benefitId] = benefit._sum.pointsEarned || 0;
		}

		const benefitDetails = await this.prisma.spaceBenefit.findMany({
			where: {
				id: {
					in: benefitUsage.map((benefit) => benefit.benefitId),
				},
			},
			select: {
				id: true,
				description: true,
				space: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		return benefitDetails.map((benefit) => ({
			benefitId: benefit.id,
			benefit: benefit.description,
			totalPoints: benefitPointMap[benefit.id],
			spaceId: benefit.space.id,
			spaceName: benefit.space.name,
		}));
	}

	getSystemNfts() {
		return this.prisma.systemNftCollection.findMany({
			select: {
				name: true,
				tokenAddress: true,
			},
			where: {
				addressUpdated: true,
			},
		});
	}

	async getNftBenefitUsage(props: {
		tokenAddress: string;
		startDate?: string;
	}) {
		const startDate = props.startDate ? new Date(props.startDate) : null;

		const benefitUsages = await this.prisma.spaceBenefitUsage.findMany({
			orderBy: {
				createdAt: 'desc',
			},
			where: {
				tokenAddress: props.tokenAddress,
				...(startDate && {
					createdAt: {
						gte: startDate,
					},
				}),
			},
			select: {
				createdAt: true,
				benefitId: true,
				userId: true,
				pointsEarned: true,
				tokenAddress: true,
				benefit: {
					select: {
						description: true,
						spaceId: true,
						space: {
							select: {
								name: true,
							},
						},
					},
				},
				user: {
					select: {
						nickName: true,
						email: true,
						loginType: true,
					},
				},
				nftCollection: {
					select: {
						name: true,
						symbol: true,
						chain: true,
					},
				},
			},
		});

		return benefitUsages.map(
			({ benefit, user, nftCollection, ...rest }) => ({
				...rest,
				benefitDescription: benefit.description,
				spaceId: benefit.spaceId,
				spaceName: benefit.space.name,
				userName: user.nickName,
				userEmail: user.email,
				userLoginType: user.loginType,
				nftName: nftCollection.name,
				nftSymbol: nftCollection.symbol,
				nftChain: nftCollection.chain,
			}),
		);
	}
}
