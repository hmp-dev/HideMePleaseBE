import {
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { CreatePushNotificationDto } from '@/api/push-notification/push-notification.types';
import { PAGE_SIZES } from '@/constants';
import { FirebaseService } from '@/modules/firebase/firebase.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class PushNotificationService {
	private readonly logger = new Logger(PushNotificationService.name);

	constructor(
		private prisma: PrismaService,
		private firebaseService: FirebaseService,
	) {}

	// 푸시 알림 생성 (DB 저장 + FCM 전송)
	async createPushNotification(dto: CreatePushNotificationDto) {
		try {
			// 1. DB에 알림 저장
			const notification = await this.prisma.notification.create({
				data: {
					userId: dto.userId,
					type: dto.type,
					title: dto.title,
					body: dto.body,
					params: dto.params || null,
					sent: true,
					isRead: false,
				},
			});

			// 2. 사용자 FCM 토큰 조회
			const user = await this.prisma.user.findFirst({
				where: {
					id: dto.userId,
					notificationsEnabled: true,
				},
				select: {
					fcmToken: true,
				},
			});

			// 3. FCM 푸시 전송
			if (user?.fcmToken) {
				await this.firebaseService.sendNotifications({
					notification: {
						title: dto.title,
						body: dto.body,
					},
					data: {
						type: dto.type,
						notificationId: notification.id,
						...(dto.params || {}),
					},
					token: user.fcmToken,
				});
			} else {
				this.logger.warn(
					`FCM 토큰이 없거나 알림이 비활성화된 사용자: ${dto.userId}`,
				);
			}

			this.logger.log(
				`푸시 알림 생성 완료: ${dto.type} - ${dto.userId}`,
			);

			return notification;
		} catch (error) {
			this.logger.error(
				`푸시 알림 생성 실패: ${dto.type} - ${dto.userId}`,
				error,
			);
			throw error;
		}
	}

	// 사용자 알림 목록 조회 (내 알림 + 전역 알림)
	async getUserNotifications({
		request,
		page = 1,
	}: {
		request: Request;
		page?: number;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const notifications = await this.prisma.notification.findMany({
			where: {
				OR: [
					{ userId: authContext.userId }, // 내 알림
					{ userId: null }, // 전역 알림
				],
				sent: true,
			},
			take: PAGE_SIZES.NOTIFICATION,
			skip: PAGE_SIZES.NOTIFICATION * (page - 1),
			orderBy: {
				createdAt: 'desc',
			},
			select: {
				id: true,
				createdAt: true,
				type: true,
				title: true,
				body: true,
				params: true,
				isRead: true,
				userId: true, // 전역 알림 구분용
			},
		});

		return notifications;
	}

	// 알림 읽음 처리 (전역 알림은 읽음 처리 불가)
	async markAsRead({
		notificationId,
		request,
	}: {
		notificationId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const notification = await this.prisma.notification.findFirst({
			where: {
				id: notificationId,
			},
		});

		if (!notification) {
			throw new NotFoundException('알림을 찾을 수 없습니다');
		}

		// 전역 알림(공지사항)은 읽음 처리 안 함
		if (notification.userId === null) {
			return { success: true, message: '전역 알림은 읽음 처리되지 않습니다' };
		}

		// 내 알림인지 확인
		if (notification.userId !== authContext.userId) {
			throw new NotFoundException('알림을 찾을 수 없습니다');
		}

		await this.prisma.notification.update({
			where: { id: notificationId },
			data: { isRead: true },
		});

		return { success: true };
	}

	// 읽지 않은 알림 개수 조회 (전역 알림은 제외)
	async getUnreadCount({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const count = await this.prisma.notification.count({
			where: {
				userId: authContext.userId, // 전역 알림(userId=null) 제외
				sent: true,
				isRead: false,
			},
		});

		return { count };
	}

	// 알림 삭제
	async deleteNotification({
		notificationId,
		request,
	}: {
		notificationId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const notification = await this.prisma.notification.findFirst({
			where: {
				id: notificationId,
				userId: authContext.userId,
			},
		});

		if (!notification) {
			throw new NotFoundException('알림을 찾을 수 없습니다');
		}

		await this.prisma.notification.delete({
			where: { id: notificationId },
		});

		return { success: true };
	}

	// 전체 사용자에게 푸시 알림 전송 (전역 알림)
	async broadcastPushNotification({
		type,
		title,
		body,
		params,
	}: {
		type: string;
		title: string;
		body: string;
		params?: any;
	}) {
		try {
			// 1. 전역 알림 생성 (userId=null)
			const notification = await this.prisma.notification.create({
				data: {
					userId: null, // 전역 알림
					type,
					title,
					body,
					params: params || null,
					sent: true,
					isRead: false,
				},
			});

			this.logger.log(`전역 알림 생성 완료: ${notification.id}`);

			// 2. 알림 수신을 활성화한 모든 사용자 조회
			const users = await this.prisma.user.findMany({
				where: {
					deleted: false,
					notificationsEnabled: true,
				},
				select: {
					id: true,
					fcmToken: true,
				},
			});

			this.logger.log(`FCM 발송 시작: ${users.length}명의 사용자`);

			// 3. 배치 크기 설정 (한 번에 100명씩)
			const BATCH_SIZE = 100;
			const batches = [];

			for (let i = 0; i < users.length; i += BATCH_SIZE) {
				batches.push(users.slice(i, i + BATCH_SIZE));
			}

			// 4. 배치별로 FCM 전송
			let successCount = 0;
			let failCount = 0;

			for (const batch of batches) {
				const results = await Promise.allSettled(
					batch.map(async (user) => {
						try {
							// FCM 푸시 전송
							if (user.fcmToken) {
								await this.firebaseService.sendNotifications({
									notification: {
										title,
										body,
									},
									data: {
										type,
										notificationId: notification.id,
										...(params || {}),
									},
									token: user.fcmToken,
								});
							}

							return { success: true, userId: user.id };
						} catch (error) {
							this.logger.error(
								`FCM 발송 실패 (userId: ${user.id})`,
								error,
							);
							return { success: false, userId: user.id, error };
						}
					}),
				);

				// 결과 집계
				results.forEach((result) => {
					if (result.status === 'fulfilled' && result.value.success) {
						successCount++;
					} else {
						failCount++;
					}
				});
			}

			this.logger.log(
				`전체 알림 발송 완료 - 성공: ${successCount}, 실패: ${failCount}`,
			);

			return {
				success: true,
				notificationId: notification.id,
				totalUsers: users.length,
				successCount,
				failCount,
			};
		} catch (error) {
			this.logger.error('전체 알림 발송 실패', error);
			throw error;
		}
	}
}
