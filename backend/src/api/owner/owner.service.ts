import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ReservationStatus, StoreStatus } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

import {
	CreateOwnerSpaceDTO,
	UpdateOwnerSpaceDTO,
	GetOwnerReservationsQueryDTO,
	UpdateReservationStatusDTO,
} from '@/api/owner/owner.dto';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class OwnerService {
	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
	) {}

	async getMySpaces({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const spaces = await this.prisma.space.findMany({
			where: {
				ownerId: authContext.userId,
				deleted: false,
			},
			select: {
				id: true,
				name: true,
				nameEn: true,
				address: true,
				category: true,
				storeStatus: true,
				createdAt: true,
				image: {
					select: {
						id: true,
						filename_download: true,
						filename_disk: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return spaces.map((space) => ({
			...space,
			imageUrl: space.image
				? this.mediaService.getUrl(space.image as any)
				: null,
		}));
	}

	async createSpace({
		createSpaceDTO,
		request,
	}: {
		createSpaceDTO: CreateOwnerSpaceDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const user = await this.prisma.user.findUnique({
			where: { id: authContext.userId },
			select: { isOwner: true },
		});

		if (!user?.isOwner) {
			throw new BadRequestException('점주 권한이 필요합니다');
		}

		const space = await this.prisma.space.create({
			data: {
				name: createSpaceDTO.name,
				nameEn: createSpaceDTO.nameEn,
				latitude: createSpaceDTO.latitude,
				longitude: createSpaceDTO.longitude,
				address: createSpaceDTO.address,
				addressEn: createSpaceDTO.addressEn,
				webLink: createSpaceDTO.webLink || '',
				businessHoursStart: createSpaceDTO.businessHoursStart,
				businessHoursEnd: createSpaceDTO.businessHoursEnd,
				category: createSpaceDTO.category,
				introduction: createSpaceDTO.introduction || '',
				introductionEn: createSpaceDTO.introductionEn,
				imageId: createSpaceDTO.imageId,
				ownerId: authContext.userId,
				storeStatus: StoreStatus.DRAFT,
			},
			include: {
				image: {
					select: {
						id: true,
						filename_download: true,
						filename_disk: true,
					},
				},
			},
		});

		return {
			...space,
			imageUrl: space.image
				? this.mediaService.getUrl(space.image as any)
				: null,
		};
	}

	async updateSpace({
		spaceId,
		updateSpaceDTO,
		request,
	}: {
		spaceId: string;
		updateSpaceDTO: UpdateOwnerSpaceDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const space = await this.prisma.space.findFirst({
			where: {
				id: spaceId,
				ownerId: authContext.userId,
				deleted: false,
			},
		});

		if (!space) {
			throw new NotFoundException('매장을 찾을 수 없습니다');
		}

		const updated = await this.prisma.space.update({
			where: { id: spaceId },
			data: {
				...updateSpaceDTO,
			},
			include: {
				image: {
					select: {
						id: true,
						filename_download: true,
						filename_disk: true,
					},
				},
			},
		});

		return {
			...updated,
			imageUrl: updated.image
				? this.mediaService.getUrl(updated.image as any)
				: null,
		};
	}

	async submitForApproval({
		spaceId,
		request,
	}: {
		spaceId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const space = await this.prisma.space.findFirst({
			where: {
				id: spaceId,
				ownerId: authContext.userId,
				deleted: false,
			},
		});

		if (!space) {
			throw new NotFoundException('매장을 찾을 수 없습니다');
		}

		if (space.storeStatus !== StoreStatus.DRAFT && space.storeStatus !== StoreStatus.REJECTED) {
			throw new BadRequestException('현재 상태에서는 승인 요청할 수 없습니다');
		}

		const updated = await this.prisma.space.update({
			where: { id: spaceId },
			data: {
				storeStatus: StoreStatus.PENDING,
			},
		});

		return { success: true, space: updated };
	}

	async getSpaceReservations({
		spaceId,
		query,
		request,
	}: {
		spaceId: string;
		query: GetOwnerReservationsQueryDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const space = await this.prisma.space.findFirst({
			where: {
				id: spaceId,
				ownerId: authContext.userId,
				deleted: false,
			},
		});

		if (!space) {
			throw new NotFoundException('매장을 찾을 수 없습니다');
		}

		const page = query.page || 1;
		const limit = query.limit || 20;
		const skip = (page - 1) * limit;

		const where: any = {
			spaceId,
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
					user: {
						select: {
							id: true,
							nickName: true,
							finalProfileImageUrl: true,
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
				user: {
					id: r.user.id,
					nickName: r.user.nickName,
					profileImageUrl: r.user.finalProfileImageUrl,
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

	async confirmReservation({
		reservationId,
		updateDTO,
		request,
	}: {
		reservationId: string;
		updateDTO: UpdateReservationStatusDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const reservation = await this.prisma.reservation.findFirst({
			where: {
				id: reservationId,
				deleted: false,
				space: {
					ownerId: authContext.userId,
				},
			},
		});

		if (!reservation) {
			throw new NotFoundException('예약을 찾을 수 없습니다');
		}

		if (reservation.status !== ReservationStatus.PENDING) {
			throw new BadRequestException('대기 중인 예약만 확정할 수 있습니다');
		}

		const updated = await this.prisma.reservation.update({
			where: { id: reservationId },
			data: {
				status: ReservationStatus.CONFIRMED,
				confirmedAt: new Date(),
				ownerMemo: updateDTO.ownerMemo,
			},
		});

		return { success: true, reservation: updated };
	}

	async cancelReservationByOwner({
		reservationId,
		updateDTO,
		request,
	}: {
		reservationId: string;
		updateDTO: UpdateReservationStatusDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const reservation = await this.prisma.reservation.findFirst({
			where: {
				id: reservationId,
				deleted: false,
				space: {
					ownerId: authContext.userId,
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
				cancelReason: updateDTO.cancelReason,
				ownerMemo: updateDTO.ownerMemo,
			},
		});

		return { success: true, reservation: updated };
	}

	async completeReservation({
		reservationId,
		updateDTO,
		request,
	}: {
		reservationId: string;
		updateDTO: UpdateReservationStatusDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const reservation = await this.prisma.reservation.findFirst({
			where: {
				id: reservationId,
				deleted: false,
				space: {
					ownerId: authContext.userId,
				},
			},
		});

		if (!reservation) {
			throw new NotFoundException('예약을 찾을 수 없습니다');
		}

		if (reservation.status !== ReservationStatus.CONFIRMED) {
			throw new BadRequestException('확정된 예약만 완료 처리할 수 있습니다');
		}

		const updated = await this.prisma.reservation.update({
			where: { id: reservationId },
			data: {
				status: ReservationStatus.COMPLETED,
				ownerMemo: updateDTO.ownerMemo,
			},
		});

		return { success: true, reservation: updated };
	}

	async noShowReservation({
		reservationId,
		updateDTO,
		request,
	}: {
		reservationId: string;
		updateDTO: UpdateReservationStatusDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const reservation = await this.prisma.reservation.findFirst({
			where: {
				id: reservationId,
				deleted: false,
				space: {
					ownerId: authContext.userId,
				},
			},
		});

		if (!reservation) {
			throw new NotFoundException('예약을 찾을 수 없습니다');
		}

		if (reservation.status !== ReservationStatus.CONFIRMED) {
			throw new BadRequestException('확정된 예약만 노쇼 처리할 수 있습니다');
		}

		const updated = await this.prisma.reservation.update({
			where: { id: reservationId },
			data: {
				status: ReservationStatus.NO_SHOW,
				ownerMemo: updateDTO.ownerMemo,
			},
		});

		return { success: true, reservation: updated };
	}

	async getDashboard({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const now = new Date();
		const todayStart = startOfDay(now);
		const todayEnd = endOfDay(now);
		const weekStart = startOfWeek(now, { weekStartsOn: 1 });
		const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

		const mySpaceIds = await this.prisma.space
			.findMany({
				where: {
					ownerId: authContext.userId,
					deleted: false,
				},
				select: { id: true },
			})
			.then((spaces) => spaces.map((s) => s.id));

		const [
			todayReservations,
			pendingReservations,
			weeklyReservations,
			totalSpaces,
			approvedSpaces,
		] = await Promise.all([
			this.prisma.reservation.count({
				where: {
					spaceId: { in: mySpaceIds },
					reservationTime: { gte: todayStart, lte: todayEnd },
					deleted: false,
				},
			}),
			this.prisma.reservation.count({
				where: {
					spaceId: { in: mySpaceIds },
					status: ReservationStatus.PENDING,
					deleted: false,
				},
			}),
			this.prisma.reservation.count({
				where: {
					spaceId: { in: mySpaceIds },
					reservationTime: { gte: weekStart, lte: weekEnd },
					deleted: false,
				},
			}),
			this.prisma.space.count({
				where: {
					ownerId: authContext.userId,
					deleted: false,
				},
			}),
			this.prisma.space.count({
				where: {
					ownerId: authContext.userId,
					storeStatus: StoreStatus.APPROVED,
					deleted: false,
				},
			}),
		]);

		return {
			todayReservations,
			pendingReservations,
			weeklyReservations,
			totalSpaces,
			approvedSpaces,
		};
	}

	async registerOwnerFcmToken({
		request,
		fcmToken,
	}: {
		request: Request;
		fcmToken: string;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		await this.prisma.user.update({
			where: { id: authContext.userId },
			data: { ownerFcmToken: fcmToken },
		});

		return { success: true };
	}

	async removeOwnerFcmToken({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		await this.prisma.user.update({
			where: { id: authContext.userId },
			data: { ownerFcmToken: null },
		});

		return { success: true };
	}
}
