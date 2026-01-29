import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';

import {
	CreateReservationDTO,
	GetReservationsQueryDTO,
	CancelReservationDTO,
} from '@/api/reservation/reservation.dto';
import { PUSH_NOTIFICATION_TYPES } from '@/api/push-notification/push-notification.types';
import { FirebaseService } from '@/modules/firebase/firebase.service';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class ReservationService {
	private readonly logger = new Logger(ReservationService.name);

	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
		private firebaseService: FirebaseService,
	) {}

	async createReservation({
		createReservationDTO,
		request,
	}: {
		createReservationDTO: CreateReservationDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const userId = authContext?.userId || null;

		const space = await this.prisma.space.findUnique({
			where: { id: createReservationDTO.spaceId },
		});

		if (!space) {
			throw new NotFoundException('매장을 찾을 수 없습니다');
		}

		if (space.storeStatus !== 'APPROVED') {
			throw new BadRequestException('현재 예약을 받지 않는 매장입니다');
		}

		const reservationTime = new Date(createReservationDTO.reservationTime);
		if (reservationTime < new Date()) {
			throw new BadRequestException('과거 시간으로 예약할 수 없습니다');
		}

		const reservation = await this.prisma.reservation.create({
			data: {
				spaceId: createReservationDTO.spaceId,
				userId,
				guestName: createReservationDTO.guestName,
				reservationTime,
				guestCount: createReservationDTO.guestCount,
				contactNumber: createReservationDTO.contactNumber,
				memo: createReservationDTO.memo,
				status: ReservationStatus.PENDING,
			},
			include: {
				space: {
					select: {
						id: true,
						name: true,
						nameEn: true,
						address: true,
						image: {
							select: {
								id: true,
								filename_download: true,
								filename_disk: true,
							},
						},
						owner: {
							select: {
								id: true,
								ownerFcmToken: true,
								nickName: true,
							},
						},
					},
				},
				user: {
					select: {
						nickName: true,
					},
				},
			},
		});

		// 디버그 로그
		this.logger.log(
			`[DEBUG] 예약 생성 완료: ${reservation.id}, owner: ${JSON.stringify(reservation.space.owner)}`,
		);

		// 점주에게 푸시 알림 전송
		if (reservation.space.owner?.ownerFcmToken) {
			const formattedDate = this.formatReservationTime(reservationTime);
			const guestDisplayName =
				reservation.user?.nickName ||
				reservation.guestName ||
				'고객';
			this.logger.log(
				`[DEBUG] 푸시 전송 시작: reservationId=${reservation.id}, token=${reservation.space.owner.ownerFcmToken.substring(0, 20)}...`,
			);
			try {
				await this.firebaseService.sendNotifications({
					notification: {
						title: '새 예약이 접수되었습니다',
						body: `${guestDisplayName}님이 ${reservation.guestCount}명 예약 (${formattedDate})`,
					},
					data: {
						type: PUSH_NOTIFICATION_TYPES.OWNER_NEW_RESERVATION,
						reservationId: reservation.id,
						spaceId: reservation.spaceId,
					},
					token: reservation.space.owner.ownerFcmToken,
				});
				this.logger.log(
					`Owner push notification sent for reservation ${reservation.id}`,
				);
			} catch (error) {
				this.logger.error(
					`Failed to send owner push notification for reservation ${reservation.id}`,
					error,
				);
			}
		} else {
			this.logger.log(
				`[DEBUG] 푸시 스킵 - owner: ${!!reservation.space.owner}, token: ${!!reservation.space.owner?.ownerFcmToken}`,
			);
		}

		return {
			...reservation,
			space: {
				...reservation.space,
				imageUrl: reservation.space.image
					? this.mediaService.getUrl(reservation.space.image as any)
					: null,
			},
		};
	}

	private formatReservationTime(date: Date): string {
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const hours = date.getHours();
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${month}/${day} ${hours}:${minutes}`;
	}

	async getMyReservations({
		query,
		request,
	}: {
		query: GetReservationsQueryDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const page = query.page || 1;
		const limit = query.limit || 20;
		const skip = (page - 1) * limit;

		const where: any = {
			userId: authContext.userId,
			deleted: false,
		};

		if (query.status) {
			where.status = query.status;
		}

		if (query.startDate || query.endDate) {
			where.reservationTime = {};
			if (query.startDate) {
				where.reservationTime.gte = new Date(query.startDate);
			}
			if (query.endDate) {
				where.reservationTime.lte = new Date(query.endDate);
			}
		}

		const [reservations, total] = await Promise.all([
			this.prisma.reservation.findMany({
				where,
				include: {
					space: {
						select: {
							id: true,
							name: true,
							nameEn: true,
							address: true,
							image: {
								select: {
									id: true,
									filename_download: true,
									filename_disk: true,
								},
							},
						},
					},
				},
				orderBy: { reservationTime: 'desc' },
				skip,
				take: limit,
			}),
			this.prisma.reservation.count({ where }),
		]);

		return {
			reservations: reservations.map((r) => ({
				...r,
				space: {
					...r.space,
					imageUrl: r.space.image
						? this.mediaService.getUrl(r.space.image as any)
						: null,
				},
			})),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async getReservation({
		reservationId,
		request,
	}: {
		reservationId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const reservation = await this.prisma.reservation.findFirst({
			where: {
				id: reservationId,
				userId: authContext.userId,
				deleted: false,
			},
			include: {
				space: {
					select: {
						id: true,
						name: true,
						nameEn: true,
						address: true,
						image: {
							select: {
								id: true,
								filename_download: true,
								filename_disk: true,
							},
						},
					},
				},
			},
		});

		if (!reservation) {
			throw new NotFoundException('예약을 찾을 수 없습니다');
		}

		return {
			...reservation,
			space: {
				...reservation.space,
				imageUrl: reservation.space.image
					? this.mediaService.getUrl(reservation.space.image as any)
					: null,
			},
		};
	}

	async cancelReservation({
		reservationId,
		cancelDTO,
		request,
	}: {
		reservationId: string;
		cancelDTO: CancelReservationDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const reservation = await this.prisma.reservation.findFirst({
			where: {
				id: reservationId,
				userId: authContext.userId,
				deleted: false,
			},
			select: {
				id: true,
				reservationTime: true,
				guestCount: true,
				guestName: true,
				spaceId: true,
				status: true,
				space: {
					select: {
						id: true,
						name: true,
						owner: {
							select: {
								id: true,
								ownerFcmToken: true,
							},
						},
					},
				},
				user: {
					select: {
						nickName: true,
					},
				},
			},
		});

		if (!reservation) {
			throw new NotFoundException('예약을 찾을 수 없습니다');
		}

		if (
			reservation.status === ReservationStatus.CANCELLED ||
			reservation.status === ReservationStatus.COMPLETED
		) {
			throw new BadRequestException('취소할 수 없는 예약입니다');
		}

		const updated = await this.prisma.reservation.update({
			where: { id: reservationId },
			data: {
				status: ReservationStatus.CANCELLED,
				cancelledAt: new Date(),
				cancelReason: cancelDTO.cancelReason,
			},
		});

		// 점주에게 예약 취소 푸시 알림 전송
		if (reservation.space.owner?.ownerFcmToken) {
			const formattedDate = this.formatReservationTime(
				reservation.reservationTime,
			);
			const guestDisplayName =
				reservation.user?.nickName || reservation.guestName || '고객';
			try {
				await this.firebaseService.sendNotifications({
					notification: {
						title: '예약이 취소되었습니다',
						body: `${guestDisplayName}님의 ${formattedDate} 예약이 취소되었습니다`,
					},
					data: {
						type: PUSH_NOTIFICATION_TYPES.OWNER_RESERVATION_CANCELLED,
						reservationId: reservation.id,
						spaceId: reservation.spaceId,
					},
					token: reservation.space.owner.ownerFcmToken,
				});
				this.logger.log(
					`Owner push notification sent for reservation cancellation ${reservation.id}`,
				);
			} catch (error) {
				this.logger.error(
					`Failed to send owner push notification for reservation cancellation ${reservation.id}`,
					error,
				);
			}
		}

		return { success: true, reservation: updated };
	}
}
