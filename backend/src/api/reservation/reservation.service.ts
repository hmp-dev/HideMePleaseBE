import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
	OnModuleDestroy,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationStatus } from '@prisma/client';
import axios from 'axios';

import {
	CreateReservationDTO,
	GetReservationsQueryDTO,
	CancelReservationDTO,
	CreateAgentReservationDTO,
	AgentReservationResponse,
	WebhookCallbackPayload,
} from '@/api/reservation/reservation.dto';
import { PUSH_NOTIFICATION_TYPES } from '@/api/push-notification/push-notification.types';
import { FirebaseService } from '@/modules/firebase/firebase.service';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

// 에이전트 예약 만료 시간 (5분)
const AGENT_RESERVATION_TIMEOUT_MS = 5 * 60 * 1000;

@Injectable()
export class ReservationService implements OnModuleDestroy {
	private readonly logger = new Logger(ReservationService.name);
	// 5분 타이머를 저장하는 Map (reservationId -> timeoutId)
	private expirationTimers = new Map<string, NodeJS.Timeout>();

	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
		private firebaseService: FirebaseService,
	) {}

	onModuleDestroy() {
		// 모듈 종료 시 모든 타이머 정리
		for (const timer of this.expirationTimers.values()) {
			clearTimeout(timer);
		}
		this.expirationTimers.clear();
	}

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

		// 매장 최대 예약 가능 인원 초과 여부 체크
		if (
			space.maxReservationPartySize &&
			createReservationDTO.guestCount > space.maxReservationPartySize
		) {
			throw new BadRequestException({
				statusCode: 400,
				error: 'RESERVATION_PARTY_SIZE_EXCEEDED',
				message: `최대 예약 가능 인원(${space.maxReservationPartySize}명)을 초과했습니다.`,
			});
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

	// ==========================================
	// AI 에이전트 예약 관련 메서드
	// ==========================================

	/**
	 * AI 에이전트용 예약 생성
	 * - 5분 만료 시간 설정
	 * - 점주에게 푸시 알림 발송
	 * - 5분 타이머 스케줄링
	 */
	async createAgentReservation(
		dto: CreateAgentReservationDTO,
	): Promise<AgentReservationResponse> {
		// 매장 확인
		const space = await this.prisma.space.findUnique({
			where: { id: dto.spaceId },
			select: {
				id: true,
				name: true,
				nameEn: true,
				storeStatus: true,
				reservationEnabled: true,
				maxReservationPartySize: true,
				owner: {
					select: {
						id: true,
						ownerFcmToken: true,
					},
				},
			},
		});

		if (!space) {
			throw new NotFoundException('매장을 찾을 수 없습니다');
		}

		if (space.storeStatus !== 'APPROVED') {
			throw new BadRequestException('현재 예약을 받지 않는 매장입니다');
		}

		// 매장 최대 예약 가능 인원 초과 여부 체크
		if (
			space.maxReservationPartySize &&
			dto.guestCount > space.maxReservationPartySize
		) {
			throw new BadRequestException({
				statusCode: 400,
				error: 'RESERVATION_PARTY_SIZE_EXCEEDED',
				message: `최대 예약 가능 인원(${space.maxReservationPartySize}명)을 초과했습니다.`,
			});
		}

		// 예약 시간 검증
		const reservationTime = new Date(dto.reservationTime);
		if (reservationTime < new Date()) {
			throw new BadRequestException('과거 시간으로 예약할 수 없습니다');
		}

		// 만료 시간 계산 (현재 + 5분)
		const expiresAt = new Date(Date.now() + AGENT_RESERVATION_TIMEOUT_MS);

		// 예약 생성
		const reservation = await this.prisma.reservation.create({
			data: {
				spaceId: dto.spaceId,
				reservationTime,
				guestCount: dto.guestCount,
				guestName: dto.guestName,
				contactNumber: dto.guestPhone, // guestPhone을 contactNumber에 매핑
				memo: dto.memo,
				agentName: dto.agentName,
				callbackUrl: dto.callbackUrl,
				expiresAt,
				status: ReservationStatus.PENDING,
			},
		});

		this.logger.log(
			`[Agent Reservation] 생성됨: ${reservation.id}, agent: ${dto.agentName}, expires: ${expiresAt.toISOString()}`,
		);

		// 점주에게 푸시 알림 발송
		if (space.owner?.ownerFcmToken) {
			await this.sendAgentReservationPush({
				reservation,
				space,
				ownerFcmToken: space.owner.ownerFcmToken,
				expiresAt,
			});
		} else {
			this.logger.warn(
				`[Agent Reservation] 점주 FCM 토큰 없음 - spaceId: ${dto.spaceId}`,
			);
		}

		// 5분 타이머 스케줄링
		this.scheduleExpirationTimer(reservation.id, expiresAt);

		return {
			success: true,
			reservationId: reservation.id,
			status: 'pending',
			expiresAt: expiresAt.toISOString(),
			message:
				'예약 요청이 매장에 전달되었습니다. 5분 내에 결과가 callbackUrl로 전송됩니다.',
		};
	}

	/**
	 * 에이전트 예약 푸시 알림 발송
	 */
	private async sendAgentReservationPush({
		reservation,
		space,
		ownerFcmToken,
		expiresAt,
	}: {
		reservation: {
			id: string;
			reservationTime: Date;
			guestCount: number;
			guestName: string | null;
			contactNumber: string | null;
			agentName: string | null;
		};
		space: { id: string; name: string };
		ownerFcmToken: string;
		expiresAt: Date;
	}) {
		try {
			await this.firebaseService.sendNotifications({
				notification: {
					title: '새 예약 요청',
					body: `${reservation.agentName}를 통해 ${reservation.guestCount}명 예약 요청이 들어왔습니다.`,
				},
				data: {
					type: PUSH_NOTIFICATION_TYPES.OWNER_AGENT_RESERVATION_REQUEST,
					reservationId: reservation.id,
					reservationTime: reservation.reservationTime.toISOString(),
					guestCount: String(reservation.guestCount),
					guestName: reservation.guestName || '',
					guestPhone: reservation.contactNumber || '',
					agentName: reservation.agentName || '',
					spaceName: space.name,
					spaceId: space.id,
					expiresAt: expiresAt.toISOString(),
				},
				android: {
					priority: 'high' as const,
					notification: {
						channelId: 'findme_reservation_channel',
						sound: 'default',
					},
				},
				apns: {
					headers: {
						'apns-priority': '10',
						'apns-push-type': 'alert',
					},
					payload: {
						aps: {
							alert: {
								title: '새 예약 요청',
								body: `${reservation.agentName}를 통해 ${reservation.guestCount}명 예약 요청이 들어왔습니다.`,
							},
							sound: 'default',
							badge: 1,
							'interruption-level': 'time-sensitive',
						},
					},
				},
				token: ownerFcmToken,
			});

			this.logger.log(
				`[Agent Reservation] 푸시 발송 완료: ${reservation.id}`,
			);
		} catch (error) {
			this.logger.error(
				`[Agent Reservation] 푸시 발송 실패: ${reservation.id}`,
				error,
			);
		}
	}

	/**
	 * 5분 만료 타이머 스케줄링
	 */
	private scheduleExpirationTimer(reservationId: string, expiresAt: Date) {
		const timeoutMs = expiresAt.getTime() - Date.now();

		if (timeoutMs <= 0) {
			// 이미 만료된 경우 즉시 처리
			this.handleReservationExpiration(reservationId);
			return;
		}

		const timer = setTimeout(() => {
			this.handleReservationExpiration(reservationId);
		}, timeoutMs);

		this.expirationTimers.set(reservationId, timer);

		this.logger.log(
			`[Agent Reservation] 만료 타이머 설정: ${reservationId}, ${Math.round(timeoutMs / 1000)}초 후`,
		);
	}

	/**
	 * 만료 타이머 취소 (점주가 응답한 경우)
	 */
	cancelExpirationTimer(reservationId: string) {
		const timer = this.expirationTimers.get(reservationId);
		if (timer) {
			clearTimeout(timer);
			this.expirationTimers.delete(reservationId);
			this.logger.log(
				`[Agent Reservation] 만료 타이머 취소됨: ${reservationId}`,
			);
		}
	}

	/**
	 * 예약 만료 처리
	 */
	private async handleReservationExpiration(reservationId: string) {
		this.expirationTimers.delete(reservationId);

		try {
			// 예약 상태 확인
			const reservation = await this.prisma.reservation.findUnique({
				where: { id: reservationId },
				select: {
					id: true,
					status: true,
					callbackUrl: true,
					spaceId: true,
					space: {
						select: { name: true },
					},
				},
			});

			if (!reservation) {
				this.logger.warn(
					`[Agent Reservation] 만료 처리 - 예약 없음: ${reservationId}`,
				);
				return;
			}

			// 이미 처리된 경우 스킵
			if (reservation.status !== ReservationStatus.PENDING) {
				this.logger.log(
					`[Agent Reservation] 이미 처리됨 (status: ${reservation.status}): ${reservationId}`,
				);
				return;
			}

			// 만료 처리
			await this.prisma.reservation.update({
				where: { id: reservationId },
				data: {
					status: ReservationStatus.EXPIRED,
				},
			});

			this.logger.log(
				`[Agent Reservation] 만료 처리 완료: ${reservationId}`,
			);

			// Webhook 콜백 발송
			if (reservation.callbackUrl) {
				await this.sendWebhookCallback(reservation.callbackUrl, {
					reservationId: reservation.id,
					status: 'expired',
					message:
						'매장에서 5분 내에 응답하지 않아 예약 요청이 자동 취소되었습니다.',
				});
			}
		} catch (error) {
			this.logger.error(
				`[Agent Reservation] 만료 처리 실패: ${reservationId}`,
				error,
			);
		}
	}

	/**
	 * Webhook 콜백 발송 (재시도 로직 포함)
	 */
	async sendWebhookCallback(
		callbackUrl: string,
		payload: WebhookCallbackPayload,
		retries = 3,
	): Promise<boolean> {
		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				const response = await axios.post(callbackUrl, payload, {
					timeout: 10000, // 10초 타임아웃
					headers: {
						'Content-Type': 'application/json',
					},
				});

				this.logger.log(
					`[Webhook] 발송 성공: ${payload.reservationId} -> ${callbackUrl} (status: ${response.status})`,
				);
				return true;
			} catch (error) {
				this.logger.warn(
					`[Webhook] 발송 실패 (시도 ${attempt}/${retries}): ${payload.reservationId} -> ${callbackUrl}`,
					error instanceof Error ? error.message : error,
				);

				if (attempt < retries) {
					// 재시도 전 대기 (exponential backoff)
					await new Promise((resolve) =>
						setTimeout(resolve, Math.pow(2, attempt) * 1000),
					);
				}
			}
		}

		this.logger.error(
			`[Webhook] 최종 발송 실패: ${payload.reservationId} -> ${callbackUrl}`,
		);
		return false;
	}

	/**
	 * 크론잡: 만료된 에이전트 예약 처리 (안전장치)
	 * 타이머가 실패했을 경우를 대비한 백업 처리
	 */
	@Cron(CronExpression.EVERY_MINUTE)
	async processExpiredAgentReservations() {
		const now = new Date();

		// expiresAt이 지났지만 아직 PENDING인 예약 찾기
		const expiredReservations = await this.prisma.reservation.findMany({
			where: {
				status: ReservationStatus.PENDING,
				expiresAt: {
					not: null,
					lt: now,
				},
				deleted: false,
			},
			select: {
				id: true,
				callbackUrl: true,
				spaceId: true,
				space: {
					select: { name: true },
				},
			},
		});

		if (expiredReservations.length === 0) {
			return;
		}

		this.logger.log(
			`[Cron] 만료된 에이전트 예약 처리: ${expiredReservations.length}건`,
		);

		for (const reservation of expiredReservations) {
			try {
				await this.prisma.reservation.update({
					where: { id: reservation.id },
					data: {
						status: ReservationStatus.EXPIRED,
					},
				});

				// Webhook 콜백 발송
				if (reservation.callbackUrl) {
					await this.sendWebhookCallback(reservation.callbackUrl, {
						reservationId: reservation.id,
						status: 'expired',
						message:
							'매장에서 5분 내에 응답하지 않아 예약 요청이 자동 취소되었습니다.',
					});
				}

				this.logger.log(
					`[Cron] 만료 처리 완료: ${reservation.id}`,
				);
			} catch (error) {
				this.logger.error(
					`[Cron] 만료 처리 실패: ${reservation.id}`,
					error,
				);
			}
		}
	}
}
