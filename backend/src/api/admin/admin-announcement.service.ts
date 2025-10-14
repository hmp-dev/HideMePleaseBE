import {
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import {
	CreateAnnouncementDTO,
	UpdateAnnouncementDTO,
} from '@/api/admin/admin-announcement.dto';
import { PushNotificationService } from '@/api/push-notification/push-notification.service';
import { PUSH_NOTIFICATION_TYPES } from '@/api/push-notification/push-notification.types';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class AdminAnnouncementService {
	private readonly logger = new Logger(AdminAnnouncementService.name);

	constructor(
		private prisma: PrismaService,
		private pushNotificationService: PushNotificationService,
	) {}

	// 공지사항 생성
	async createAnnouncement(dto: CreateAnnouncementDTO) {
		try {
			// 1. 공지사항 DB 저장
			const announcement = await this.prisma.announcements.create({
				data: {
					title: dto.title,
					description: dto.description,
				},
			});

			this.logger.log(`공지사항 생성 완료: ${announcement.id}`);

			// 2. 푸시 알림 발송 (옵션)
			let notificationResult;
			if (dto.sendNotification !== false) {
				notificationResult = await this.pushNotificationService.broadcastPushNotification({
					type: PUSH_NOTIFICATION_TYPES.ANNOUNCEMENT,
					title: dto.title,
					body: dto.description,
					params: {
						announcementId: announcement.id,
					},
				});

				this.logger.log(
					`공지사항 알림 발송 완료 - 성공: ${notificationResult.successCount}, 실패: ${notificationResult.failCount}`,
				);
			}

			return {
				success: true,
				message: '공지사항이 생성되었습니다',
				announcementId: announcement.id,
				notificationResult,
			};
		} catch (error) {
			this.logger.error('공지사항 생성 실패', error);
			throw error;
		}
	}

	// 공지사항 수정
	async updateAnnouncement(announcementId: string, dto: UpdateAnnouncementDTO) {
		const announcement = await this.prisma.announcements.findFirst({
			where: { id: announcementId },
		});

		if (!announcement) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		const updated = await this.prisma.announcements.update({
			where: { id: announcementId },
			data: {
				...(dto.title && { title: dto.title }),
				...(dto.description && { description: dto.description }),
			},
		});

		this.logger.log(`공지사항 수정 완료: ${announcementId}`);

		return {
			success: true,
			message: '공지사항이 수정되었습니다',
			announcement: updated,
		};
	}

	// 공지사항 삭제
	async deleteAnnouncement(announcementId: string) {
		const announcement = await this.prisma.announcements.findFirst({
			where: { id: announcementId },
		});

		if (!announcement) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		await this.prisma.announcements.delete({
			where: { id: announcementId },
		});

		this.logger.log(`공지사항 삭제 완료: ${announcementId}`);

		return {
			success: true,
			message: '공지사항이 삭제되었습니다',
		};
	}

	// 공지사항 상세 조회
	async getAnnouncement(announcementId: string) {
		const announcement = await this.prisma.announcements.findFirst({
			where: { id: announcementId },
		});

		if (!announcement) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		return announcement;
	}
}
