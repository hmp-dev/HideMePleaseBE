import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PromisePool } from '@supercharge/promise-pool';
import { I18nService } from 'nestjs-i18n';

import {
	AdminNotification,
	NotificationType,
	UnifiedNotification,
	UserCommunityRankChangeNotification,
	UserCommunityRankFallenNotification,
} from '@/api/notification/notification.types';
import { PAGE_SIZES } from '@/constants';
import { FirebaseService } from '@/modules/firebase/firebase.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';
import { getNumberWithOrdinal } from '@/utils/number';

@Injectable()
export class NotificationService {
	private readonly logger = new Logger(NotificationService.name);

	constructor(
		private i18n: I18nService,
		private prisma: PrismaService,
		private firebaseService: FirebaseService,
	) {}

	async getUserNotifications({
		request,
		page,
	}: {
		request: Request;
		page: number;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const currentPage = isNaN(page) || !page ? 1 : page;

		return this.prisma.notification.findMany({
			where: {
				userId: authContext.userId,
				sent: true,
			},
			take: PAGE_SIZES.NOTIFICATION,
			skip: PAGE_SIZES.NOTIFICATION * (currentPage - 1),
			orderBy: {
				createdAt: 'desc',
			},
			select: {
				id: true,
				createdAt: true,
				title: true,
				body: true,
				type: true,
				params: true,
			},
		});
	}

	async sendNotification(notification: UnifiedNotification) {
		this.logger.log(`Sending ${notification.type} notification`);

		try {
			if (
				notification.type === NotificationType.UserCommunityRankChange
			) {
				await this.sendUserCommunityRankChangeNotification(
					notification,
				);
			} else if (
				notification.type === NotificationType.UserCommunityRankFallen
			) {
				await this.sendUserCommunityRankFallenNotification(
					notification,
				);
			} else if (notification.type === NotificationType.Admin) {
				await this.sendAdminNotification(notification);
			}
			this.logger.log(`Sent ${notification.type} notification`);
		} catch (e) {
			this.logger.error(
				`Unable to send ${notification} notification, with err: ${e}`,
			);
		}
	}

	private async sendUserCommunityRankChangeNotification({
		tokenAddress,
		userId,
		newRank,
		type,
	}: UserCommunityRankChangeNotification) {
		const [allUsersInCommunity, user] = await Promise.all([
			this.prisma.nft.findMany({
				where: {
					tokenAddress,
					selected: true,
				},
				select: {
					name: true,
					ownedWallet: {
						select: {
							user: {
								select: {
									id: true,
									fcmToken: true,
								},
							},
						},
					},
				},
			}),
			this.prisma.user.findFirst({
				where: {
					id: userId,
				},
				select: {
					nickName: true,
				},
			}),
		]);

		if (!allUsersInCommunity.length) {
			return;
		}

		const communityFcmTokens = new Set<string>();
		for (const nft of allUsersInCommunity) {
			const fcmToken = nft.ownedWallet.user.fcmToken;
			if (fcmToken) {
				communityFcmTokens.add(fcmToken);
			}
		}

		const title = this.i18n.t('notification.communityRankUpdate', {
			args: { community: allUsersInCommunity[0].name },
		});
		const body = this.i18n.t('notification.userRankChanged', {
			args: {
				nickName: user?.nickName || '',
				newRank: getNumberWithOrdinal(newRank),
			},
		});

		await Promise.all(
			allUsersInCommunity.map((communityUser) =>
				this.prisma.notification.create({
					data: {
						title,
						body,
						type,
						sent: true,
						userId: communityUser.ownedWallet.user.id,
					},
				}),
			),
		);

		await PromisePool.withConcurrency(10)
			.for(communityFcmTokens)
			.process(async (fcmToken) => {
				await this.firebaseService.buildAndSendNotification({
					type,
					body,
					title,
					fcmToken,
				});
			});
	}

	private async sendUserCommunityRankFallenNotification({
		tokenAddress,
		userId,
		newRank,
		oldRank,
		type,
	}: UserCommunityRankFallenNotification) {
		const user = await this.prisma.user.findFirst({
			where: {
				id: userId,
			},
			select: {
				fcmToken: true,
			},
		});

		if (!user?.fcmToken) {
			this.logger.log(
				`Could not send UserCommunityRankFallenNotification notif due to missing fcm, userId: ${userId} `,
			);
			return;
		}

		const nftCollection = await this.prisma.nftCollection.findFirst({
			where: {
				tokenAddress,
			},
			select: {
				name: true,
			},
		});

		const title = this.i18n.t('notification.userRankingDrop', {
			args: { community: nftCollection?.name || '' },
		});
		const body = this.i18n.t('notification.userRankChanged', {
			args: {
				oldRank: getNumberWithOrdinal(oldRank),
				newRank: getNumberWithOrdinal(newRank),
			},
		});

		await Promise.all([
			this.prisma.notification.create({
				data: {
					title,
					body,
					type,
					sent: true,
					userId,
				},
			}),
			this.firebaseService.buildAndSendNotification({
				type,
				body,
				title,
				fcmToken: user.fcmToken,
			}),
		]);
	}

	private async sendAdminNotification({
		userId,
		type,
		title,
		body,
	}: AdminNotification) {
		const fcmUsers: { id: string; fcmToken: string }[] = [];

		if (userId) {
			const user = await this.prisma.user.findFirst({
				where: {
					id: userId,
				},
				select: {
					fcmToken: true,
					id: true,
				},
			});
			if (user?.fcmToken) {
				fcmUsers.push({
					id: user.id,
					fcmToken: user.fcmToken,
				});
			}
		} else {
			const users = await this.prisma.user.findMany({
				select: {
					fcmToken: true,
					id: true,
				},
			});
			users.forEach((user) => {
				if (user.fcmToken) {
					fcmUsers.push({
						id: user.id,
						fcmToken: user.fcmToken,
					});
				}
			});
		}

		if (!fcmUsers.length) {
			return;
		}

		const insertionData = fcmUsers.map((user) => ({
			title,
			body,
			type,
			sent: true,
			userId: user.id,
		}));

		await this.prisma.notification.createMany({
			data: insertionData,
		});

		await PromisePool.withConcurrency(10)
			.for(fcmUsers)
			.process(async (user) => {
				await this.firebaseService.buildAndSendNotification({
					type,
					body,
					title,
					fcmToken: user.fcmToken,
				});
			});
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async sendPendingNotifications() {
		const notifications = await this.prisma.scheduleNotification.findMany({
			where: {
				sent: false,
				scheduleTime: {
					lt: new Date(),
				},
			},
		});

		for (const notification of notifications) {
			try {
				await this.sendNotification({
					userId: notification.userId,
					type: NotificationType.Admin,
					title: notification.title,
					body: notification.body,
				});

				await this.prisma.scheduleNotification.update({
					where: {
						id: notification.id,
					},
					data: {
						sent: true,
					},
				});
			} catch (e) {
				this.logger.error(
					`Could not send admin notif for ${notification.id}`,
				);
			}
		}
	}
}
