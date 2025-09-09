import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PointService } from '@/api/points/point.service';
import { WalletService } from '@/api/wallet/wallet.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
// import { SendbirdService } from '@/modules/sendbird/sendbird.service';
import { AuthContext } from '@/types';
import { EnvironmentVariables } from '@/utils/env';
import { ErrorCodes } from '@/utils/errorCodes';

import { UpdateUserProfileDTO } from './users.dto';

@Injectable()
export class UsersService {
	constructor(
		private prisma: PrismaService,
		private walletService: WalletService,
		private pointService: PointService,
		// private sendbirdService: SendbirdService,
		private configService: ConfigService<EnvironmentVariables, true>,
	) {}

	async getUserProfile({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const userProfile = await this.prisma.user.findFirst({
			where: { id: authContext.userId },
			select: {
				id: true,
				nickName: true,
				introduction: true,
				locationPublic: true,
				notificationsEnabled: true,
				chatAccessToken: true,
				pfpNftId: true,
			},
		});

		if (!userProfile) {
			throw new BadRequestException(ErrorCodes.USER_DOES_NOT_EXIST);
		}

		// Sendbird disabled - commenting out chatAccessToken generation
		// if (!userProfile.chatAccessToken) {
		// 	const chatAccessToken = await this.sendbirdService.createUser({
		// 		userId: authContext.userId,
		// 		nickname: userProfile.nickName || 'user',
		// 	});

		// 	await this.prisma.user.update({
		// 		where: {
		// 			id: authContext.userId,
		// 		},
		// 		data: {
		// 			chatAccessToken,
		// 		},
		// 	});
		// 	userProfile.chatAccessToken = chatAccessToken;
		// }

		// 포인트 정보 조회
		let pointBalance;
		try {
			pointBalance = await this.pointService.getOrCreateBalance(authContext.userId);
		} catch (error) {
			// 포인트 조회 실패 시 기본값 설정
			console.error('Failed to fetch point balance:', error);
			pointBalance = {
				totalBalance: 0,
				availableBalance: 0,
				lockedBalance: 0,
				lifetimeEarned: 0,
				lifetimeSpent: 0,
			};
		}

		// 체크인 통계 조회
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		// 전체 체크인 횟수
		const totalCheckIns = await this.prisma.spaceCheckIn.count({
			where: {
				userId: authContext.userId,
			},
		});

		// 오늘 체크인 횟수
		const todayCheckIns = await this.prisma.spaceCheckIn.count({
			where: {
				userId: authContext.userId,
				checkedInAt: {
					gte: todayStart,
				},
			},
		});

		// 이번 주 체크인 횟수
		const weekCheckIns = await this.prisma.spaceCheckIn.count({
			where: {
				userId: authContext.userId,
				checkedInAt: {
					gte: weekStart,
				},
			},
		});

		// 이번 달 체크인 횟수
		const monthCheckIns = await this.prisma.spaceCheckIn.count({
			where: {
				userId: authContext.userId,
				checkedInAt: {
					gte: monthStart,
				},
			},
		});

		// 현재 활성 체크인 정보
		const activeCheckIn = await this.prisma.spaceCheckIn.findFirst({
			where: {
				userId: authContext.userId,
				isActive: true,
			},
			select: {
				spaceId: true,
				checkedInAt: true,
				space: {
					select: {
						name: true,
					},
				},
			},
		});

		return {
			...userProfile,
			pfpImageUrl: undefined,
			chatAppId: this.configService.get<string>('SENDBIRD_APP_ID'),
			pointBalance: {
				totalBalance: pointBalance.totalBalance,
				availableBalance: pointBalance.availableBalance,
				lockedBalance: pointBalance.lockedBalance,
				lifetimeEarned: pointBalance.lifetimeEarned,
				lifetimeSpent: pointBalance.lifetimeSpent,
			},
			checkInStats: {
				totalCheckIns,
				todayCheckIns,
				weekCheckIns,
				monthCheckIns,
				activeCheckIn: activeCheckIn ? {
					spaceId: activeCheckIn.spaceId,
					spaceName: activeCheckIn.space.name,
					checkedInAt: activeCheckIn.checkedInAt,
				} : null,
			},
		};
	}

	async updateUserProfile({
		updateUserProfileDTO: {
			nickName,
			pfpNftId,
			locationPublic,
			introduction,
			notificationsEnabled,
			fcmToken,
			profilePartsString,
			finalProfileImageUrl,
		},
		request,
	}: {
		updateUserProfileDTO: UpdateUserProfileDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const updateData: any = {};
		
		if (nickName !== undefined) updateData.nickName = nickName;
		if (introduction !== undefined) updateData.introduction = introduction;
		if (locationPublic !== undefined) updateData.locationPublic = locationPublic;
		if (pfpNftId !== undefined) updateData.pfpNftId = pfpNftId;
		if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
		if (fcmToken !== undefined) updateData.fcmToken = fcmToken;
		if (profilePartsString !== undefined) updateData.profilePartsString = profilePartsString;
		if (finalProfileImageUrl !== undefined) updateData.finalProfileImageUrl = finalProfileImageUrl;

		await this.prisma.user.update({
			where: {
				id: authContext.userId,
			},
			data: updateData,
		});

		// if (nickName) {
		// 	await this.sendbirdService.updateUser({
		// 		userId: authContext.userId,
		// 		nickname: nickName,
		// 	});
		// }
		// if (pfpNftId) {
		// 	const nft = await this.prisma.nft.findFirst({
		// 		where: {
		// 			id: pfpNftId,
		// 		},
		// 		select: {
		// 			imageUrl: true,
		// 		},
		// 	});
		// 	if (nft?.imageUrl) {
		// 		await this.sendbirdService.updateUser({
		// 			userId: authContext.userId,
		// 			profileImageUrl: nft.imageUrl,
		// 		});
		// 	}
		// }

		return this.getUserProfile({ request });
	}

	async deleteUser({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const user = await this.prisma.user.findFirst({
			where: {
				id: authContext.userId,
			},
			select: {
				firebaseId: true,
				wldNullifierHash: true,
				nickName: true,
				SpaceBenefitUsageUser: {
					select: {
						id: true,
					},
				},
			},
		});

		if (!user) {
			return;
		}

		// Get wallets separately
		const wallets = await this.prisma.wallet.findMany({
			where: {
				userId: authContext.userId,
			},
			select: {
				publicAddress: true,
			},
		});

		await Promise.all(
			wallets.map((wallet) =>
				this.walletService.deleteWalletByPublicAddress(
					wallet.publicAddress,
				),
			),
		);

		await this.prisma.spaceBenefitUsage.deleteMany({
			where: {
				id: {
					in: user.SpaceBenefitUsageUser.map(({ id }) => id),
				},
			},
		});

		await this.prisma.nftCollectionMemberPoints.deleteMany({
			where: {
				userId: authContext.userId,
			},
		});

		await this.prisma.user.update({
			where: {
				id: authContext.userId,
			},
			data: {
				deleted: true,
				firebaseId: user.firebaseId
					? `${user.firebaseId}_deleted_${Date.now()}`
					: undefined,
				wldNullifierHash: user.wldNullifierHash
					? `${user.wldNullifierHash}_deleted_${Date.now()}`
					: undefined,
				nickName: user.nickName
					? `${user.nickName}_deleted_${Date.now()}`
					: undefined,
			},
		});
	}

	async doesUserExistByNickName(nickName: string) {
		return Boolean(
			await this.prisma.user.findFirst({
				where: {
					nickName,
				},
				select: {
					id: true,
				},
			}),
		);
	}
}
