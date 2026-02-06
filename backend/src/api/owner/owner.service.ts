import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { DayOfWeek, ReservationStatus, StoreStatus } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

import {
	CreateOwnerSpaceDTO,
	UpdateOwnerSpaceDTO,
	GetOwnerReservationsQueryDTO,
	UpdateReservationStatusDTO,
	UnifiedUpdateReservationDTO,
	CreateOwnerBenefitDTO,
	UpdateOwnerBenefitDTO,
	GetOwnerBenefitsQueryDTO,
	OwnerSpaceStatusDTO,
	RegisterOwnerDTO,
} from '@/api/owner/owner.dto';
import { ReservationService } from '@/api/reservation/reservation.service';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class OwnerService {
	private readonly logger = new Logger(OwnerService.name);

	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
		@Inject(forwardRef(() => ReservationService))
		private reservationService: ReservationService,
	) {}

	async getMySpaces({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const fileSelect = {
			select: {
				id: true,
				filename_download: true,
				filename_disk: true,
			},
		} as const;

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
				image: fileSelect,
				photo1: fileSelect,
				photo2: fileSelect,
				photo3: fileSelect,
				businessRegistrationImage: fileSelect,
				latitude: true,
				longitude: true,
				addressEn: true,
				webLink: true,
				businessHoursStart: true,
				businessHoursEnd: true,
				introduction: true,
				introductionEn: true,
				locationDescription: true,
				isTemporarilyClosed: true,
				temporaryClosureReason: true,
				temporaryClosureEndDate: true,
				checkInEnabled: true,
				checkInPointsOverride: true,
				checkInRequirements: true,
				dailyCheckInLimit: true,
				maxCheckInCapacity: true,
				phoneNumber: true,
				eventEnabled: true,
				reservationEnabled: true,
				parkingAvailable: true,
				valetAvailable: true,
				groupSeatingAvailable: true,
				highChairAvailable: true,
				outletAvailable: true,
				wheelchairAccessible: true,
				noKidsZone: true,
				petFriendly: true,
				veganType: true,
				veganFriendly: true,
				wifiAvailable: true,
				wifiSsid: true,
				restroomLocation: true,
				restroomGender: true,
				smokingArea: true,
				paymentMethods: true,
				reservationDepositRequired: true,
				waitlistAvailable: true,
				maxReservationPartySize: true,
				soldOutMenuIds: true,
				terraceSeating: true,
				lastOrderTime: true,
				takeoutAvailable: true,
				strollerStorage: true,
				// SpaceBenefit 포함
				SpaceBenefit: {
					where: { deleted: false, active: true },
					select: {
						id: true,
						description: true,
						descriptionEn: true,
						isRepresentative: true,
						dayOfWeek: true,
						level: true,
					},
					orderBy: [
						{ isRepresentative: 'desc' },
						{ createdAt: 'asc' },
					],
				},
				// SpaceBusinessHours 포함
				SpaceBusinessHours: {
					select: {
						dayOfWeek: true,
						openTime: true,
						closeTime: true,
						breakStartTime: true,
						breakEndTime: true,
						isClosed: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		// 모든 요일 목록
		const allDays: DayOfWeek[] = [
			DayOfWeek.MONDAY,
			DayOfWeek.TUESDAY,
			DayOfWeek.WEDNESDAY,
			DayOfWeek.THURSDAY,
			DayOfWeek.FRIDAY,
			DayOfWeek.SATURDAY,
			DayOfWeek.SUNDAY,
		];

		return spaces.map((space) => {
			// 대표 혜택 또는 첫 번째 혜택 찾기
			const representativeBenefit =
				space.SpaceBenefit.find((b) => b.isRepresentative) ||
				space.SpaceBenefit[0] ||
				null;

			// dayBenefits 생성: 모든 요일에 동일한 혜택 적용
			const dayBenefits: Record<
				string,
				{ description: string; descriptionEn: string | null }[]
			> = {};

			if (representativeBenefit) {
				for (const day of allDays) {
					dayBenefits[day] = [
						{
							description: representativeBenefit.description,
							descriptionEn: representativeBenefit.descriptionEn,
						},
					];
				}
			}

			// businessHours 생성: 요일별 영업시간
			const businessHours: Record<
				string,
				{
					openTime: string | null;
					closeTime: string | null;
					breakStartTime: string | null;
					breakEndTime: string | null;
					isClosed: boolean;
				}
			> = {};

			for (const hours of space.SpaceBusinessHours) {
				if (hours.dayOfWeek) {
					businessHours[hours.dayOfWeek] = {
						openTime: hours.openTime,
						closeTime: hours.closeTime,
						breakStartTime: hours.breakStartTime,
						breakEndTime: hours.breakEndTime,
						isClosed: hours.isClosed,
					};
				}
			}

			// SpaceBenefit, SpaceBusinessHours 필드 제거하고 변환된 데이터로 대체
			const { SpaceBenefit, SpaceBusinessHours, ...spaceWithoutRelations } = space;

			return {
				...spaceWithoutRelations,
				imageUrl: space.image
					? this.mediaService.getUrl(space.image as any)
					: null,
				photo1Url: space.photo1
					? this.mediaService.getUrl(space.photo1 as any)
					: null,
				photo2Url: space.photo2
					? this.mediaService.getUrl(space.photo2 as any)
					: null,
				photo3Url: space.photo3
					? this.mediaService.getUrl(space.photo3 as any)
					: null,
				businessRegistrationImageUrl: space.businessRegistrationImage
					? this.mediaService.getUrl(space.businessRegistrationImage as any)
					: null,
				dayBenefits,
				businessHours,
			};
		});
	}

	async registerOwner({
		registerOwnerDTO,
		request,
	}: {
		registerOwnerDTO: RegisterOwnerDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const data: any = {
			isOwner: true,
		};

		if (registerOwnerDTO.ownerName !== undefined) {
			data.ownerName = registerOwnerDTO.ownerName;
		}
		if (registerOwnerDTO.phoneNumber !== undefined) {
			data.phoneNumber = registerOwnerDTO.phoneNumber;
		}
		if (registerOwnerDTO.email !== undefined) {
			data.email = registerOwnerDTO.email;
		}
		if (registerOwnerDTO.termsAccepted !== undefined) {
			data.termsAccepted = registerOwnerDTO.termsAccepted;
		}
		if (registerOwnerDTO.termsAcceptedAt) {
			data.termsAcceptedAt = new Date(registerOwnerDTO.termsAcceptedAt);
		}
		if (registerOwnerDTO.marketingOptIn !== undefined) {
			data.marketingOptIn = registerOwnerDTO.marketingOptIn;
		}
		if (registerOwnerDTO.notificationSetupCompleted !== undefined) {
			data.notificationSetupCompleted =
				registerOwnerDTO.notificationSetupCompleted;
		}

		const updated = await this.prisma.user.update({
			where: { id: authContext.userId },
			data,
			select: {
				id: true,
				email: true,
				ownerName: true,
				phoneNumber: true,
				isOwner: true,
				termsAccepted: true,
				termsAcceptedAt: true,
				marketingOptIn: true,
				notificationSetupCompleted: true,
			},
		});

		return { success: true, user: updated };
	}

	async getSpaceStatus({
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
			select: {
				isTemporarilyClosed: true,
				eventEnabled: true,
				reservationEnabled: true,
				temporaryClosureReason: true,
				temporaryClosureEndDate: true,
			},
		});

		if (!space) {
			throw new NotFoundException('매장을 찾을 수 없습니다');
		}

		return space;
	}

	async getSpace({
		spaceId,
		request,
	}: {
		spaceId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const fileSelect = {
			select: {
				id: true,
				filename_download: true,
				filename_disk: true,
			},
		} as const;

		const space = await this.prisma.space.findFirst({
			where: {
				id: spaceId,
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
				image: fileSelect,
				photo1: fileSelect,
				photo2: fileSelect,
				photo3: fileSelect,
				businessRegistrationImage: fileSelect,
				latitude: true,
				longitude: true,
				addressEn: true,
				webLink: true,
				businessHoursStart: true,
				businessHoursEnd: true,
				introduction: true,
				introductionEn: true,
				locationDescription: true,
				isTemporarilyClosed: true,
				temporaryClosureReason: true,
				temporaryClosureEndDate: true,
				checkInEnabled: true,
				checkInPointsOverride: true,
				checkInRequirements: true,
				dailyCheckInLimit: true,
				maxCheckInCapacity: true,
				phoneNumber: true,
				eventEnabled: true,
				reservationEnabled: true,
				parkingAvailable: true,
				valetAvailable: true,
				groupSeatingAvailable: true,
				highChairAvailable: true,
				outletAvailable: true,
				wheelchairAccessible: true,
				noKidsZone: true,
				petFriendly: true,
				veganType: true,
				veganFriendly: true,
				wifiAvailable: true,
				wifiSsid: true,
				restroomLocation: true,
				restroomGender: true,
				smokingArea: true,
				paymentMethods: true,
				reservationDepositRequired: true,
				waitlistAvailable: true,
				maxReservationPartySize: true,
				soldOutMenuIds: true,
				terraceSeating: true,
				lastOrderTime: true,
				takeoutAvailable: true,
				strollerStorage: true,
			},
		});

		if (!space) {
			throw new NotFoundException('매장을 찾을 수 없습니다');
		}

		return {
			...space,
			imageUrl: space.image
				? this.mediaService.getUrl(space.image as any)
				: null,
			photo1Url: space.photo1
				? this.mediaService.getUrl(space.photo1 as any)
				: null,
			photo2Url: space.photo2
				? this.mediaService.getUrl(space.photo2 as any)
				: null,
			photo3Url: space.photo3
				? this.mediaService.getUrl(space.photo3 as any)
				: null,
			businessRegistrationImageUrl: space.businessRegistrationImage
				? this.mediaService.getUrl(space.businessRegistrationImage as any)
				: null,
		};
	}

	async createSpace({
		createSpaceDTO,
		request,
	}: {
		createSpaceDTO: CreateOwnerSpaceDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const fileSelect = {
			select: {
				id: true,
				filename_download: true,
				filename_disk: true,
			},
		} as const;

		// businessHours에서 businessHoursStart/End 도출
		let businessHoursStart =
			createSpaceDTO.businessHoursStart || '';
		let businessHoursEnd =
			createSpaceDTO.businessHoursEnd || '';

		if (
			createSpaceDTO.businessHours &&
			(!businessHoursStart || !businessHoursEnd)
		) {
			const firstOpenDay = Object.values(
				createSpaceDTO.businessHours,
			).find((h) => !h.isClosed);
			if (firstOpenDay) {
				businessHoursStart =
					businessHoursStart || firstOpenDay.openTime || '';
				businessHoursEnd =
					businessHoursEnd || firstOpenDay.closeTime || '';
			}
		}

		// photos 배열에서 imageId, photo1Id~photo3Id 매핑
		let imageId = createSpaceDTO.imageId;
		let photo1Id = createSpaceDTO.photo1Id;
		let photo2Id = createSpaceDTO.photo2Id;
		let photo3Id = createSpaceDTO.photo3Id;

		if (createSpaceDTO.photos && createSpaceDTO.photos.length > 0) {
			const photoIds = createSpaceDTO.photos
				.map((p: any) => p?.id)
				.filter(Boolean);
			const mainIdx = createSpaceDTO.mainPhotoIndex ?? 0;
			if (photoIds.length > 0) {
				imageId = imageId || photoIds[mainIdx] || photoIds[0];
				const remaining = photoIds.filter(
					(_: any, i: number) => i !== mainIdx,
				);
				photo1Id = photo1Id || remaining[0];
				photo2Id = photo2Id || remaining[1];
				photo3Id = photo3Id || remaining[2];
			}
		}

		// businessLicense에서 businessRegistrationImageId 매핑
		let businessRegistrationImageId =
			createSpaceDTO.businessRegistrationImageId;
		if (
			!businessRegistrationImageId &&
			createSpaceDTO.businessLicense?.id
		) {
			businessRegistrationImageId =
				createSpaceDTO.businessLicense.id;
		}

		const space = await this.prisma.space.create({
			data: {
				name: createSpaceDTO.name,
				nameEn: createSpaceDTO.nameEn,
				latitude: createSpaceDTO.latitude ?? 0,
				longitude: createSpaceDTO.longitude ?? 0,
				address: createSpaceDTO.address,
				addressEn: createSpaceDTO.addressEn,
				webLink: createSpaceDTO.webLink || '',
				businessHoursStart,
				businessHoursEnd,
				category: createSpaceDTO.category,
				introduction: createSpaceDTO.introduction || '',
				introductionEn: createSpaceDTO.introductionEn,
				imageId: imageId!,
				photo1Id,
				photo2Id,
				photo3Id,
				businessRegistrationImageId,
				phoneNumber: createSpaceDTO.phoneNumber,
				maxCheckInCapacity: createSpaceDTO.maxCheckInCapacity,
				eventEnabled: createSpaceDTO.eventEnabled,
				reservationEnabled: createSpaceDTO.reservationEnabled,
				parkingAvailable: createSpaceDTO.parkingAvailable,
				valetAvailable: createSpaceDTO.valetAvailable,
				groupSeatingAvailable: createSpaceDTO.groupSeatingAvailable,
				highChairAvailable: createSpaceDTO.highChairAvailable,
				outletAvailable: createSpaceDTO.outletAvailable,
				wheelchairAccessible: createSpaceDTO.wheelchairAccessible,
				noKidsZone: createSpaceDTO.noKidsZone,
				petFriendly: createSpaceDTO.petFriendly,
				veganType: createSpaceDTO.veganType,
				veganFriendly: createSpaceDTO.veganFriendly,
				wifiAvailable: createSpaceDTO.wifiAvailable,
				wifiSsid: createSpaceDTO.wifiSsid,
				restroomLocation: createSpaceDTO.restroomLocation,
				restroomGender: createSpaceDTO.restroomGender,
				smokingArea: createSpaceDTO.smokingArea,
				paymentMethods: createSpaceDTO.paymentMethods,
				reservationDepositRequired: createSpaceDTO.reservationDepositRequired,
				waitlistAvailable: createSpaceDTO.waitlistAvailable,
				maxReservationPartySize: createSpaceDTO.maxReservationPartySize,
				soldOutMenuIds: createSpaceDTO.soldOutMenuIds,
				terraceSeating: createSpaceDTO.terraceSeating,
				lastOrderTime: createSpaceDTO.lastOrderTime,
				takeoutAvailable: createSpaceDTO.takeoutAvailable,
				strollerStorage: createSpaceDTO.strollerStorage,
				ownerId: authContext.userId,
				storeStatus: StoreStatus.DRAFT,
			},
			include: {
				image: fileSelect,
				photo1: fileSelect,
				photo2: fileSelect,
				photo3: fileSelect,
				businessRegistrationImage: fileSelect,
			},
		});

		// SpaceBusinessHours 생성
		if (createSpaceDTO.businessHours) {
			const businessHoursData = Object.entries(
				createSpaceDTO.businessHours,
			).map(([dayOfWeek, hours]) => ({
				spaceId: space.id,
				dayOfWeek,
				isClosed: hours.isClosed ?? false,
				openTime: hours.openTime || null,
				closeTime: hours.closeTime || null,
				breakStartTime: hours.breakStartTime || null,
				breakEndTime: hours.breakEndTime || null,
			}));

			await this.prisma.spaceBusinessHours.createMany({
				data: businessHoursData,
			});
		}

		// SpaceBenefit 생성
		if (createSpaceDTO.dayBenefits) {
			const validDays = Object.values(DayOfWeek) as string[];
			const benefitData: {
				spaceId: string;
				description: string;
				dayOfWeek: DayOfWeek;
			}[] = [];
			for (const [dayOfWeek, benefits] of Object.entries(
				createSpaceDTO.dayBenefits,
			)) {
				if (!validDays.includes(dayOfWeek)) continue;
				for (const benefit of benefits) {
					benefitData.push({
						spaceId: space.id,
						description: benefit.name,
						dayOfWeek: dayOfWeek as DayOfWeek,
					});
				}
			}
			if (benefitData.length > 0) {
				await this.prisma.spaceBenefit.createMany({
					data: benefitData,
				});
			}
		}

		return {
			...space,
			imageUrl: space.image
				? this.mediaService.getUrl(space.image as any)
				: null,
			photo1Url: space.photo1
				? this.mediaService.getUrl(space.photo1 as any)
				: null,
			photo2Url: space.photo2
				? this.mediaService.getUrl(space.photo2 as any)
				: null,
			photo3Url: space.photo3
				? this.mediaService.getUrl(space.photo3 as any)
				: null,
			businessRegistrationImageUrl: space.businessRegistrationImage
				? this.mediaService.getUrl(space.businessRegistrationImage as any)
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

		const fileSelect = {
			select: {
				id: true,
				filename_download: true,
				filename_disk: true,
			},
		} as const;

		const data: any = { ...updateSpaceDTO };

		if (data.temporaryClosureEndDate) {
			data.temporaryClosureEndDate = new Date(data.temporaryClosureEndDate);
		}

		// 재심사가 필요한 크리티컬 필드 목록
		const criticalFields = [
			'name',
			'businessRegistrationImageId',
			'address',
		];

		// APPROVED 상태에서 크리티컬 필드가 변경된 경우에만 PENDING(심사중)으로 전환
		if (space.storeStatus === StoreStatus.APPROVED) {
			const hasCriticalChange = criticalFields.some(
				(field) =>
					updateSpaceDTO[field as keyof typeof updateSpaceDTO] !== undefined &&
					updateSpaceDTO[field as keyof typeof updateSpaceDTO] !== space[field as keyof typeof space],
			);

			if (hasCriticalChange) {
				data.storeStatus = StoreStatus.PENDING;
			}
		}

		const updated = await this.prisma.space.update({
			where: { id: spaceId },
			data,
			include: {
				image: fileSelect,
				photo1: fileSelect,
				photo2: fileSelect,
				photo3: fileSelect,
				businessRegistrationImage: fileSelect,
			},
		});

		return {
			...updated,
			imageUrl: updated.image
				? this.mediaService.getUrl(updated.image as any)
				: null,
			photo1Url: updated.photo1
				? this.mediaService.getUrl(updated.photo1 as any)
				: null,
			photo2Url: updated.photo2
				? this.mediaService.getUrl(updated.photo2 as any)
				: null,
			photo3Url: updated.photo3
				? this.mediaService.getUrl(updated.photo3 as any)
				: null,
			businessRegistrationImageUrl: updated.businessRegistrationImage
				? this.mediaService.getUrl(updated.businessRegistrationImage as any)
				: null,
		};
	}

	async updateSpaceStatus({
		spaceId,
		statusDTO,
		request,
	}: {
		spaceId: string;
		statusDTO: OwnerSpaceStatusDTO;
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

		const data: any = { ...statusDTO };
		if (data.temporaryClosureEndDate) {
			data.temporaryClosureEndDate = new Date(data.temporaryClosureEndDate);
		}

		const updated = await this.prisma.space.update({
			where: { id: spaceId },
			data,
		});

		return { success: true, space: updated };
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
				user: r.user
					? {
							id: r.user.id,
							nickName: r.user.nickName,
							profileImageUrl: r.user.finalProfileImageUrl,
						}
					: null,
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
			include: {
				space: {
					select: {
						name: true,
					},
				},
			},
		});

		if (!reservation) {
			throw new NotFoundException('예약을 찾을 수 없습니다');
		}

		// 이미 만료된 에이전트 예약인 경우
		if (
			reservation.status === ReservationStatus.EXPIRED ||
			(reservation.expiresAt && reservation.expiresAt < new Date())
		) {
			throw new BadRequestException({
				success: false,
				error: 'RESERVATION_EXPIRED',
				message: '응답 시간이 초과되어 이미 만료된 예약입니다.',
			});
		}

		if (reservation.status !== ReservationStatus.PENDING) {
			throw new BadRequestException('대기 중인 예약만 확정할 수 있습니다');
		}

		const confirmedAt = new Date();
		const updated = await this.prisma.reservation.update({
			where: { id: reservationId },
			data: {
				status: ReservationStatus.CONFIRMED,
				confirmedAt,
				ownerMemo: updateDTO.ownerMemo,
			},
		});

		// 에이전트 예약인 경우: 타이머 취소 + Webhook 콜백 발송
		if (reservation.callbackUrl) {
			this.reservationService.cancelExpirationTimer(reservationId);

			await this.reservationService.sendWebhookCallback(
				reservation.callbackUrl,
				{
					reservationId: reservation.id,
					status: 'confirmed',
					spaceId: reservation.spaceId,
					spaceName: reservation.space.name,
					reservationTime: reservation.reservationTime.toISOString(),
					guestCount: reservation.guestCount,
					guestName: reservation.guestName || undefined,
					approvedAt: confirmedAt.toISOString(),
					message: '예약이 승인되었습니다.',
				},
			);

			this.logger.log(
				`[Agent Reservation] 승인 처리 및 Webhook 발송 완료: ${reservationId}`,
			);
		}

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

		// 이미 만료된 에이전트 예약인 경우
		if (
			reservation.status === ReservationStatus.EXPIRED ||
			(reservation.expiresAt && reservation.expiresAt < new Date())
		) {
			throw new BadRequestException({
				success: false,
				error: 'RESERVATION_EXPIRED',
				message: '응답 시간이 초과되어 이미 만료된 예약입니다.',
			});
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

		// 에이전트 예약인 경우: 타이머 취소 + Webhook 콜백 발송
		if (reservation.callbackUrl) {
			this.reservationService.cancelExpirationTimer(reservationId);

			await this.reservationService.sendWebhookCallback(
				reservation.callbackUrl,
				{
					reservationId: reservation.id,
					status: 'cancelled',
					message: '매장에서 예약을 거절했습니다.',
				},
			);

			this.logger.log(
				`[Agent Reservation] 거절 처리 및 Webhook 발송 완료: ${reservationId}`,
			);
		}

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

	/**
	 * 통합 예약 상태 변경 메서드
	 * status 값에 따라 적절한 메서드로 분기
	 */
	async updateReservationStatus({
		reservationId,
		updateDTO,
		request,
	}: {
		reservationId: string;
		updateDTO: UnifiedUpdateReservationDTO;
		request: Request;
	}) {
		const statusDTO: UpdateReservationStatusDTO = {
			ownerMemo: updateDTO.ownerMemo,
			cancelReason: updateDTO.cancelReason,
		};

		switch (updateDTO.status) {
			case 'confirmed':
				return this.confirmReservation({
					reservationId,
					updateDTO: statusDTO,
					request,
				});
			case 'cancelled':
				return this.cancelReservationByOwner({
					reservationId,
					updateDTO: statusDTO,
					request,
				});
			case 'completed':
				return this.completeReservation({
					reservationId,
					updateDTO: statusDTO,
					request,
				});
			case 'no_show':
				return this.noShowReservation({
					reservationId,
					updateDTO: statusDTO,
					request,
				});
			default:
				throw new BadRequestException(
					`잘못된 상태 값입니다: ${updateDTO.status}`,
				);
		}
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

	// ── Image Upload ──

	async uploadImage({
		file,
	}: {
		file: Express.Multer.File;
		request?: Request;
	}) {
		const directusFile = await this.mediaService.uploadDirectusFile(file);

		return {
			id: directusFile.id,
			url: this.mediaService.getUrl(directusFile),
		};
	}

	// ── Benefit CRUD ──

	async createBenefit({
		spaceId,
		dto,
		request,
	}: {
		spaceId: string;
		dto: CreateOwnerBenefitDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const space = await this.prisma.space.findFirst({
			where: { id: spaceId, ownerId: authContext.userId, deleted: false },
		});

		if (!space) {
			throw new NotFoundException('매장을 찾을 수 없습니다');
		}

		const benefit = await this.prisma.spaceBenefit.create({
			data: {
				spaceId,
				description: dto.description,
				descriptionEn: dto.descriptionEn,
				dayOfWeek: dto.dayOfWeek,
				level: dto.level,
				singleUse: dto.singleUse,
				isRepresentative: dto.isRepresentative,
			},
		});

		return benefit;
	}

	async getBenefits({
		spaceId,
		query,
		request,
	}: {
		spaceId: string;
		query: GetOwnerBenefitsQueryDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const space = await this.prisma.space.findFirst({
			where: { id: spaceId, ownerId: authContext.userId, deleted: false },
		});

		if (!space) {
			throw new NotFoundException('매장을 찾을 수 없습니다');
		}

		const where: any = {
			spaceId,
			deleted: false,
		};

		if (query.dayOfWeek) {
			where.dayOfWeek = query.dayOfWeek;
		}

		const benefits = await this.prisma.spaceBenefit.findMany({
			where,
			orderBy: { createdAt: 'desc' },
		});

		return benefits;
	}

	async updateBenefit({
		spaceId,
		benefitId,
		dto,
		request,
	}: {
		spaceId: string;
		benefitId: string;
		dto: UpdateOwnerBenefitDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const benefit = await this.prisma.spaceBenefit.findFirst({
			where: {
				id: benefitId,
				spaceId,
				deleted: false,
				space: { ownerId: authContext.userId },
			},
		});

		if (!benefit) {
			throw new NotFoundException('혜택을 찾을 수 없습니다');
		}

		const updated = await this.prisma.spaceBenefit.update({
			where: { id: benefitId },
			data: {
				...dto,
			},
		});

		return updated;
	}

	async deleteBenefit({
		spaceId,
		benefitId,
		request,
	}: {
		spaceId: string;
		benefitId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const benefit = await this.prisma.spaceBenefit.findFirst({
			where: {
				id: benefitId,
				spaceId,
				deleted: false,
				space: { ownerId: authContext.userId },
			},
		});

		if (!benefit) {
			throw new NotFoundException('혜택을 찾을 수 없습니다');
		}

		await this.prisma.spaceBenefit.update({
			where: { id: benefitId },
			data: { deleted: true },
		});

		return { success: true };
	}
}
