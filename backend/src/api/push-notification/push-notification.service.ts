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
			const notification = await this.prisma.pushNotification.create({
				data: {
					userId: dto.userId,
					type: dto.type,
					title: dto.title,
					body: dto.body,
					params: dto.params || null,
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

	// 사용자 알림 목록 조회
	async getUserNotifications({
		request,
		page = 1,
	}: {
		request: Request;
		page?: number;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const notifications = await this.prisma.pushNotification.findMany({
			where: {
				userId: authContext.userId,
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
			},
		});

		return notifications;
	}

	// 알림 읽음 처리
	async markAsRead({
		notificationId,
		request,
	}: {
		notificationId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const notification = await this.prisma.pushNotification.findFirst({
			where: {
				id: notificationId,
				userId: authContext.userId,
			},
		});

		if (!notification) {
			throw new NotFoundException('알림을 찾을 수 없습니다');
		}

		await this.prisma.pushNotification.update({
			where: { id: notificationId },
			data: { isRead: true },
		});

		return { success: true };
	}

	// 읽지 않은 알림 개수 조회
	async getUnreadCount({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const count = await this.prisma.pushNotification.count({
			where: {
				userId: authContext.userId,
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

		const notification = await this.prisma.pushNotification.findFirst({
			where: {
				id: notificationId,
				userId: authContext.userId,
			},
		});

		if (!notification) {
			throw new NotFoundException('알림을 찾을 수 없습니다');
		}

		await this.prisma.pushNotification.delete({
			where: { id: notificationId },
		});

		return { success: true };
	}
}
