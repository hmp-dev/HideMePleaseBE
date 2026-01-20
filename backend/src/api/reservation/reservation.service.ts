import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';

import {
	CreateReservationDTO,
	GetReservationsQueryDTO,
	CancelReservationDTO,
} from '@/api/reservation/reservation.dto';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class ReservationService {
	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
	) {}

	async createReservation({
		createReservationDTO,
		request,
	}: {
		createReservationDTO: CreateReservationDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

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
				userId: authContext.userId,
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
					},
				},
			},
		});

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

		return { success: true, reservation: updated };
	}
}
