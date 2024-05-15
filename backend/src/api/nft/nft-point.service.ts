import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class NftPointService {
	private logger = new Logger(NftPointService.name);

	constructor(private prisma: PrismaService) {}

	async recalculateNftCollectionPoints(computeFluctuation = false) {
		this.logger.log('recalculatePoints started');

		const [nftMembers, communityPoints, existingPoints] = await Promise.all(
			[
				this.prisma.nft.findMany({
					select: {
						tokenAddress: true,
						ownedWallet: {
							select: {
								userId: true,
							},
						},
					},
				}),
				this.prisma.spaceBenefitUsage.groupBy({
					by: 'tokenAddress',
					_sum: {
						pointsEarned: true,
					},
					orderBy: {
						_sum: {
							pointsEarned: 'desc',
						},
					},
				}),
				computeFluctuation
					? this.prisma.nftCollectionPoints.findMany({
							select: {
								tokenAddress: true,
								totalPoints: true,
							},
						})
					: null,
			],
		);

		const nftUserCount: Record<string, Set<string>> = {};

		for (const nftMember of nftMembers) {
			if (!nftUserCount[nftMember.tokenAddress]) {
				nftUserCount[nftMember.tokenAddress] = new Set<string>();
			}

			nftUserCount[nftMember.tokenAddress].add(
				nftMember.ownedWallet.userId,
			);
		}

		const existingPointsCount: Record<string, number> = {};
		if (existingPoints) {
			for (const point of existingPoints) {
				existingPointsCount[point.tokenAddress] = point.totalPoints;
			}
		}

		const newPointCount: Record<string, number> = {};
		for (const point of communityPoints) {
			newPointCount[point.tokenAddress] = point._sum.pointsEarned || 0;
		}

		const insertionData = nftMembers
			.map(({ tokenAddress }) => ({
				tokenAddress: tokenAddress,
				totalMembers: nftUserCount[tokenAddress].size,
				totalPoints: newPointCount[tokenAddress] || 0,
				pointFluctuation: existingPointsCount[tokenAddress]
					? (newPointCount[tokenAddress] || 0) -
						existingPointsCount[tokenAddress]
					: undefined,
			}))
			.sort((pointA, pointB) =>
				pointA.totalPoints > pointB.totalPoints ? -1 : 1,
			)
			.map((data, index) => ({ ...data, communityRank: index + 1 }));

		await this.prisma.nftCollectionPoints.deleteMany();
		await this.prisma.nftCollectionPoints.createMany({
			data: insertionData,
			skipDuplicates: true,
		});

		this.logger.log('recalculatePoints ended');
	}

	async recalculateNftCollectionUserPoints(
		tokenAddress: string,
		computeFluctuation = false,
	) {
		const [nftMembers, communityPoints, existingPoints] = await Promise.all(
			[
				this.prisma.nft.findMany({
					select: {
						ownedWallet: {
							select: {
								userId: true,
							},
						},
					},
					where: {
						tokenAddress,
					},
				}),
				this.prisma.spaceBenefitUsage.groupBy({
					where: {
						tokenAddress,
					},
					by: 'userId',
					_sum: {
						pointsEarned: true,
					},
					orderBy: {
						_sum: {
							pointsEarned: 'desc',
						},
					},
				}),
				computeFluctuation
					? this.prisma.nftCollectionMemberPoints.findMany({
							where: {
								tokenAddress,
							},
							select: {
								userId: true,
								totalPoints: true,
							},
						})
					: null,
			],
		);

		const memberIds = [
			...new Set(nftMembers.map((member) => member.ownedWallet.userId)),
		];

		const userPointMapping: Record<string, number> = {};
		for (const point of communityPoints) {
			userPointMapping[point.userId] = point._sum?.pointsEarned ?? 0;
		}

		const userExistingPointMapping: Record<string, number> = {};
		if (existingPoints) {
			for (const point of existingPoints) {
				userExistingPointMapping[point.userId] = point.totalPoints;
			}
		}

		const nftMembersWithPoints = memberIds
			.map((userId) => {
				const totalPoints = userPointMapping[userId] ?? 0;
				return {
					userId,
					tokenAddress,
					totalPoints,
					pointFluctuation: computeFluctuation
						? totalPoints - (userExistingPointMapping[userId] || 0)
						: undefined,
				};
			})
			.sort((memberA, memberB) =>
				memberA.totalPoints > memberB.totalPoints ? -1 : 1,
			)
			.map((nftMember, index) => ({
				...nftMember,
				memberRank: index + 1,
			}));

		await this.prisma.nftCollectionMemberPoints.deleteMany({
			where: {
				tokenAddress,
			},
		});
		await this.prisma.nftCollectionMemberPoints.createMany({
			data: nftMembersWithPoints,
			skipDuplicates: true,
		});

		this.logger.log(`recalculateMemberPoints ended for ${tokenAddress}`);
	}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async computePointFluctuation() {
		await this.recalculateNftCollectionPoints(true);

		const systemNfts = await this.prisma.nftCollection.findMany({
			select: {
				tokenAddress: true,
			},
		});
		for (const systemNft of systemNfts) {
			await this.recalculateNftCollectionUserPoints(
				systemNft.tokenAddress,
				true,
			);
		}
	}
}
