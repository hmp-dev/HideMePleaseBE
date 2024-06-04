import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import {
	NotificationType,
	UnifiedNotification,
} from '@/api/notification/notification.types';
import { FirebaseService } from '@/modules/firebase/firebase.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class NotificationService {
	private readonly logger = new Logger(NotificationService.name);
	constructor(
		private i18n: I18nService,
		private prisma: PrismaService,
		private firebaseService: FirebaseService,
	) {}

	async sendNotification(notification: UnifiedNotification) {
		this.logger.log(`Sending ${notification.type} notification`);

		try {
			if (
				notification.type === NotificationType.UserCommunityRankChange
			) {
				await this.sendUserCommunityRankChangeNotification(
					notification,
				);
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
		oldRank,
		type,
	}: UnifiedNotification) {
		const [allUsersInCommunity, user] = await Promise.all([
			this.prisma.nft.findMany({
				where: {
					tokenAddress,
				},
				select: {
					name: true,
					ownedWallet: {
						select: {
							user: {
								select: {
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
			args: { nickName: user?.nickName || '', oldRank, newRank },
		});

		await Promise.all(
			[...communityFcmTokens].map((fcmToken) =>
				this.firebaseService.buildAndSendNotification({
					type,
					body,
					title,
					fcmToken,
				}),
			),
		);
	}
}
