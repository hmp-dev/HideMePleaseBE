import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GeoPosition } from 'geo-position.ts';

import { 
	CheckInDTO, 
	CheckOutDTO, 
	CheckInUserInfo, 
	CurrentGroupResponse,
	HeartbeatDTO
} from '@/api/space/space-checkin.dto';
import { NotificationService } from '@/api/notification/notification.service';
import { NotificationType } from '@/api/notification/notification.types';
import { PointService } from '@/api/points/point.service';
import { PointSource, PointTransactionType } from '@/api/points/point.types';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SystemConfigService } from '@/modules/system-config/system-config.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

const DEFAULT_CHECK_IN_POINTS = 1;
const GROUP_BONUS_POINTS = 3;
const GROUP_SIZE = 5;

@Injectable()
export class SpaceCheckInService {
	private logger = new Logger(SpaceCheckInService.name);

	constructor(
		private prisma: PrismaService,
		private systemConfig: SystemConfigService,
		private notificationService: NotificationService,
		private pointService: PointService,
	) {}

	async checkIn({
		spaceId,
		checkInDTO,
		request,
	}: {
		spaceId: string;
		checkInDTO: CheckInDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		
		// 트랜잭션 시작 전에 기본 검증 수행
		const space = await this.prisma.space.findFirst({
			where: { id: spaceId },
		});
		
		if (!space) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		if (!space.checkInEnabled) {
			throw new BadRequestException('이 공간은 현재 체크인이 불가능합니다');
		}

		// 거리 체크를 트랜잭션 밖에서 먼저 수행
		const userPosition = new GeoPosition(
			checkInDTO.latitude,
			checkInDTO.longitude,
		);
		const spacePosition = new GeoPosition(
			space.latitude,
			space.longitude,
		);
		
		const maxDistance = (await this.systemConfig.get()).maxDistanceFromSpace;
		const distance = Number(userPosition.Distance(spacePosition).toFixed(0));
		
		if (distance > maxDistance) {
			this.logger.log(`거리 체크 실패 - 사용자: ${authContext.userId}, 거리: ${distance}m, 최대: ${maxDistance}m`);
			throw new BadRequestException(ErrorCodes.SPACE_OUT_OF_RANGE);
		}

		// 모든 검증 통과 후 트랜잭션 시작
		return await this.prisma.$transaction(async (tx) => {

		// 먼저 어디든 체크인되어 있는지 확인
		const existingActiveCheckIn = await tx.spaceCheckIn.findFirst({
			where: {
				userId: authContext.userId,
				isActive: true,
			},
			include: {
				space: {
					select: {
						name: true,
					},
				},
			},
		});

		// 같은 스페이스에 이미 체크인되어 있는 경우
		if (existingActiveCheckIn && existingActiveCheckIn.spaceId === spaceId) {
			throw new BadRequestException('이미 체크인한 상태입니다');
		}

		// 다른 스페이스에 체크인되어 있는 경우 자동 체크아웃
		if (existingActiveCheckIn && existingActiveCheckIn.spaceId !== spaceId) {
			await tx.spaceCheckIn.update({
				where: { id: existingActiveCheckIn.id },
				data: { isActive: false },
			});

			this.logger.log(`사용자 ${authContext.userId} 자동 체크아웃 - 이전 공간: ${existingActiveCheckIn.space.name} (${existingActiveCheckIn.spaceId})`);

			void this.notificationService.sendNotification({
				type: NotificationType.Admin,
				userId: authContext.userId,
				title: '자동 체크아웃',
				body: `${existingActiveCheckIn.space.name}에서 자동으로 체크아웃되었습니다.`,
			});
		}

		if (space.maxCheckInCapacity) {
			const currentCheckInCount = await tx.spaceCheckIn.count({
				where: {
					spaceId,
					isActive: true,
				},
			});

			if (currentCheckInCount >= space.maxCheckInCapacity) {
				throw new BadRequestException('체크인 최대 인원수를 초과했습니다');
			}
		}

		if (space.dailyCheckInLimit) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const todayCheckInCount = await tx.spaceCheckIn.count({
				where: {
					spaceId,
					checkedInAt: {
						gte: today,
					},
				},
			});

			if (todayCheckInCount >= space.dailyCheckInLimit) {
				throw new BadRequestException('오늘의 체크인 제한 인원수를 초과했습니다');
			}
		}

		const checkInPoints = space.checkInPointsOverride || DEFAULT_CHECK_IN_POINTS;
		
		// 그룹 사이즈 결정: null이거나 5보다 크면 5, 아니면 입력값 사용
		const groupSize = !space.maxCheckInCapacity || space.maxCheckInCapacity > 5 
			? GROUP_SIZE 
			: space.maxCheckInCapacity;

		let currentGroup = await tx.spaceCheckInGroup.findFirst({
			where: {
				spaceId,
				isCompleted: false,
			},
			include: {
				checkIns: true,
			},
		});

		if (!currentGroup || currentGroup.checkIns.length >= groupSize) {
			currentGroup = await tx.spaceCheckInGroup.create({
				data: {
					spaceId,
					requiredMembers: groupSize,
					bonusPoints: GROUP_BONUS_POINTS,
				},
				include: {
					checkIns: true,
				},
			});
		}

		const checkIn = await tx.spaceCheckIn.create({
			data: {
				userId: authContext.userId,
				spaceId,
				groupId: currentGroup.id,
				latitude: checkInDTO.latitude,
				longitude: checkInDTO.longitude,
				pointsEarned: checkInPoints,
				lastActivityTime: new Date(),
			},
		});

		// 같은 트랜잭션을 사용하여 포인트 적립
		try {
			await this.pointService.earnPoints({
				userId: authContext.userId,
				amount: checkInPoints,
				type: PointTransactionType.EARNED,
				source: PointSource.CHECK_IN,
				description: `${space.name} 체크인`,
				referenceId: checkIn.id,
				referenceType: 'space_checkin',
			}, tx);
		} catch (error) {
			this.logger.error('포인트 적립 실패:', error);
			// 포인트 실패 시 전체 트랜잭션 롤백
			throw error;
		}

		const updatedGroup = await tx.spaceCheckInGroup.findFirst({
			where: { id: currentGroup.id },
			include: {
				checkIns: {
					where: { isActive: true },
				},
			},
		});

		if (updatedGroup && updatedGroup.checkIns.length === groupSize && !updatedGroup.isCompleted) {
			await tx.spaceCheckInGroup.update({
				where: { id: updatedGroup.id },
				data: {
					isCompleted: true,
					completedAt: new Date(),
					bonusAwarded: true,
				},
			});

			await Promise.all(
				updatedGroup.checkIns.map(async (checkIn) => {
					await tx.spaceCheckIn.update({
						where: { id: checkIn.id },
						data: {
							pointsEarned: checkIn.pointsEarned + GROUP_BONUS_POINTS,
						},
					});

					// 같은 트랜잭션으로 그룹 보너스 포인트 적립
					await this.pointService.earnPoints({
						userId: checkIn.userId,
						amount: GROUP_BONUS_POINTS,
						type: PointTransactionType.EARNED,
						source: PointSource.GROUP_BONUS,
						description: `${space.name} 그룹 체크인 보너스`,
						referenceId: updatedGroup.id,
						referenceType: 'group_checkin',
					}, tx);

					void this.notificationService.sendNotification({
						type: NotificationType.Admin,
						userId: checkIn.userId,
						title: '그룹 체크인 완료!',
						body: `${groupSize}명이 모여 보너스 ${GROUP_BONUS_POINTS} 포인트를 획득했습니다!`,
					});
				}),
			);
		}

		void this.notificationService.sendNotification({
			type: NotificationType.Admin,
			userId: authContext.userId,
			title: '체크인 완료',
			body: `${space.name}에 체크인하여 ${checkInPoints} SAV를 획득했습니다.`,
		});

		return {
			success: true,
			checkInId: checkIn.id,
			groupProgress: `${updatedGroup?.checkIns.length || 1}/${updatedGroup?.requiredMembers || groupSize}`,
			earnedPoints: checkInPoints,
		};
		});
	}

	async checkOut({
		spaceId,
		request,
	}: {
		spaceId: string;
		checkOutDTO: CheckOutDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const checkIn = await this.prisma.spaceCheckIn.findFirst({
			where: {
				userId: authContext.userId,
				spaceId,
				isActive: true,
			},
		});

		if (!checkIn) {
			throw new BadRequestException('체크인한 상태가 아닙니다');
		}

		await this.prisma.spaceCheckIn.update({
			where: { id: checkIn.id },
			data: { isActive: false },
		});

		return { success: true };
	}

	async heartbeat({
		heartbeatDTO,
		request,
	}: {
		heartbeatDTO: HeartbeatDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const { spaceId, latitude, longitude } = heartbeatDTO;

		// 활성 체크인 확인
		const checkIn = await this.prisma.spaceCheckIn.findFirst({
			where: {
				userId: authContext.userId,
				spaceId,
				isActive: true,
			},
			include: {
				space: {
					select: {
						latitude: true,
						longitude: true,
					},
				},
			},
		});

		if (!checkIn) {
			return {
				success: false,
				checkinStatus: 'invalid' as const,
				lastActivityTime: new Date(),
			};
		}

		// 10분 이상 비활성 체크
		const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
		if (checkIn.lastActivityTime < tenMinutesAgo) {
			// 자동 체크아웃 처리
			await this.prisma.spaceCheckIn.update({
				where: { id: checkIn.id },
				data: {
					isActive: false,
					autoCheckedOut: true,
				},
			});

			return {
				success: false,
				checkinStatus: 'expired' as const,
				lastActivityTime: checkIn.lastActivityTime,
			};
		}

		// 위치 검증 (선택적)
		const maxDistance = (await this.systemConfig.get()).maxDistanceFromSpace;
		const userPosition = new GeoPosition(latitude, longitude);
		const spacePosition = new GeoPosition(
			checkIn.space.latitude,
			checkIn.space.longitude,
		);
		const distance = Number(userPosition.Distance(spacePosition).toFixed(0));

		if (distance > maxDistance) {
			this.logger.warn(
				`Heartbeat 위치 검증 실패 - 사용자: ${authContext.userId}, 거리: ${distance}m, 최대: ${maxDistance}m`,
			);
			// 위치가 벗어났지만 체크아웃하지 않고 경고만 로그
		}

		// lastActivityTime 업데이트
		await this.prisma.spaceCheckIn.update({
			where: { id: checkIn.id },
			data: {
				lastActivityTime: new Date(),
			},
		});

		return {
			success: true,
			checkinStatus: 'active' as const,
			lastActivityTime: new Date(),
		};
	}

	async getCurrentCheckInStatus({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const checkIn = await this.prisma.spaceCheckIn.findFirst({
			where: {
				userId: authContext.userId,
				isActive: true,
			},
			include: {
				space: {
					select: {
						name: true,
					},
				},
			},
		});

		if (!checkIn) {
			return {
				hasActiveCheckin: false,
			};
		}

		return {
			hasActiveCheckin: true,
			checkin: {
				spaceId: checkIn.spaceId,
				spaceName: checkIn.space.name,
				checkinTime: checkIn.checkedInAt,
				lastActivityTime: checkIn.lastActivityTime,
				latitude: checkIn.latitude,
				longitude: checkIn.longitude,
			},
		};
	}

	async getCheckInStatus({
		spaceId,
		request,
	}: {
		spaceId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const checkIn = await this.prisma.spaceCheckIn.findFirst({
			where: {
				userId: authContext.userId,
				spaceId,
				isActive: true,
			},
			include: {
				space: true,
			},
		});

		if (!checkIn) {
			return {
				isCheckedIn: false,
			};
		}

		// 그룹 사이즈 결정
		const groupSize = !checkIn.space.maxCheckInCapacity || checkIn.space.maxCheckInCapacity > 5 
			? GROUP_SIZE 
			: checkIn.space.maxCheckInCapacity;

		// 현재 활성 그룹을 직접 조회
		const currentGroup = await this.prisma.spaceCheckInGroup.findFirst({
			where: {
				spaceId,
				isCompleted: false,
			},
			include: {
				checkIns: {
					where: { isActive: true },
				},
			},
		});

		return {
			isCheckedIn: true,
			checkedInAt: checkIn.checkedInAt,
			groupProgress: currentGroup 
				? `${currentGroup.checkIns.length}/${currentGroup.requiredMembers || groupSize}`
				: `0/${groupSize}`,
			earnedPoints: checkIn.pointsEarned,
			groupId: checkIn.groupId,
		};
	}

	async getCheckInUsers({
		spaceId,
	}: {
		spaceId: string;
	}): Promise<{
		totalCount: number;
		users: CheckInUserInfo[];
		currentGroup?: CurrentGroupResponse;
	}> {
		const checkIns = await this.prisma.spaceCheckIn.findMany({
			where: {
				spaceId,
				isActive: true,
			},
			include: {
				user: {
					select: {
						id: true,
						nickName: true,
						finalProfileImageUrl: true,
					},
				},
			},
			orderBy: {
				checkedInAt: 'desc',
			},
		});

		// Get space info to determine group size
		const space = await this.prisma.space.findFirst({
			where: { id: spaceId },
		});

		// 그룹 사이즈 결정 (다른 메소드와 동일한 로직)
		const groupSize = !space?.maxCheckInCapacity || space.maxCheckInCapacity > 5 
			? GROUP_SIZE 
			: space.maxCheckInCapacity;

		// 먼저 활성 체크인이 있는 미완료 그룹을 찾기
		let currentGroup = await this.prisma.spaceCheckInGroup.findFirst({
			where: {
				spaceId,
				isCompleted: false,
				checkIns: {
					some: {
						isActive: true,
					},
				},
			},
			include: {
				checkIns: {
					where: { isActive: true },
					include: {
						user: {
							select: {
								id: true,
								nickName: true,
								finalProfileImageUrl: true,
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		// 활성 체크인이 있는 그룹이 없으면, 가장 최근의 미완료 그룹 찾기
		if (!currentGroup) {
			currentGroup = await this.prisma.spaceCheckInGroup.findFirst({
				where: {
					spaceId,
					isCompleted: false,
				},
				include: {
					checkIns: {
						where: { isActive: true },
						include: {
							user: {
								select: {
									id: true,
									nickName: true,
									finalProfileImageUrl: true,
								},
							},
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			});
		}

		const users: CheckInUserInfo[] = checkIns.map((checkIn) => ({
			userId: checkIn.user.id,
			nickName: checkIn.user.nickName || undefined,
			profileImageUrl: checkIn.user.finalProfileImageUrl || undefined,
			checkedInAt: checkIn.checkedInAt,
		}));

		let currentGroupResponse: CurrentGroupResponse | undefined;
		if (currentGroup) {
			currentGroupResponse = {
				groupId: currentGroup.id,
				progress: `${currentGroup.checkIns.length}/${currentGroup.requiredMembers || groupSize}`,
				isCompleted: currentGroup.isCompleted,
				members: currentGroup.checkIns.map((checkIn) => ({
					userId: checkIn.user.id,
					nickName: checkIn.user.nickName || undefined,
					profileImageUrl: checkIn.user.finalProfileImageUrl || undefined,
					checkedInAt: checkIn.checkedInAt,
				})),
				bonusPoints: currentGroup.bonusPoints,
			};
		}

		return {
			totalCount: checkIns.length,
			users,
			currentGroup: currentGroupResponse,
		};
	}

	async getCurrentGroup({
		spaceId,
	}: {
		spaceId: string;
	}): Promise<CurrentGroupResponse | null> {
		// 먼저 스페이스 정보 가져오기
		const space = await this.prisma.space.findFirst({
			where: { id: spaceId },
		});

		if (!space) {
			return null;
		}

		// 그룹 사이즈 결정
		const groupSize = !space.maxCheckInCapacity || space.maxCheckInCapacity > 5 
			? GROUP_SIZE 
			: space.maxCheckInCapacity;

		// 먼저 활성 체크인이 있는 미완료 그룹을 찾기
		let group = await this.prisma.spaceCheckInGroup.findFirst({
			where: {
				spaceId,
				isCompleted: false,
				checkIns: {
					some: {
						isActive: true,
					},
				},
			},
			include: {
				checkIns: {
					where: { isActive: true },
					include: {
						user: {
							select: {
								id: true,
								nickName: true,
								finalProfileImageUrl: true,
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		// 활성 체크인이 있는 그룹이 없으면, 가장 최근의 미완료 그룹 찾기
		if (!group) {
			group = await this.prisma.spaceCheckInGroup.findFirst({
				where: {
					spaceId,
					isCompleted: false,
				},
				include: {
					checkIns: {
						where: { isActive: true },
						include: {
							user: {
								select: {
									id: true,
									nickName: true,
									finalProfileImageUrl: true,
								},
							},
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			});
		}

		if (!group) {
			// 그룹이 없어도 0/5 형태로 반환
			return {
				groupId: '',
				progress: `0/${groupSize}`,
				isCompleted: false,
				members: [],
				bonusPoints: GROUP_BONUS_POINTS,
			};
		}

		return {
			groupId: group.id,
			progress: `${group.checkIns.length}/${group.requiredMembers || groupSize}`,
			isCompleted: group.isCompleted,
			members: group.checkIns.map((checkIn) => ({
				userId: checkIn.user.id,
				nickName: checkIn.user.nickName || undefined,
				profileImageUrl: checkIn.user.finalProfileImageUrl || undefined,
				checkedInAt: checkIn.checkedInAt,
			})),
			bonusPoints: group.bonusPoints,
		};
	}

	async getCheckInCountForSpace(spaceId: string): Promise<number> {
		return await this.prisma.spaceCheckIn.count({
			where: {
				spaceId,
				isActive: true,
			},
		});
	}

	async getCheckInCountsForSpaces(spaceIds: string[]): Promise<Record<string, number>> {
		const checkIns = await this.prisma.spaceCheckIn.groupBy({
			by: ['spaceId'],
			where: {
				spaceId: { in: spaceIds },
				isActive: true,
			},
			_count: {
				id: true,
			},
		});

		const counts: Record<string, number> = {};
		for (const spaceId of spaceIds) {
			const checkIn = checkIns.find((c) => c.spaceId === spaceId);
			counts[spaceId] = checkIn ? checkIn._count.id : 0;
		}

		return counts;
	}

	async isUserCheckedIn(userId: string, spaceId: string): Promise<boolean> {
		const checkIn = await this.prisma.spaceCheckIn.findFirst({
			where: {
				userId,
				spaceId,
				isActive: true,
			},
		});

		return !!checkIn;
	}

	async checkOutAllUsers({
		spaceId,
		request,
	}: {
		spaceId: string;
		request: Request;
	}): Promise<{
		success: boolean;
		checkedOutCount: number;
		spaceName: string;
	}> {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		return await this.prisma.$transaction(async (tx) => {
			// 스페이스 존재 여부 확인
			const space = await tx.space.findFirst({
				where: { id: spaceId },
				select: {
					name: true,
				},
			});

			if (!space) {
				throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
			}

			// 현재 체크인된 사용자들 조회
			const activeCheckIns = await tx.spaceCheckIn.findMany({
				where: {
					spaceId,
					isActive: true,
				},
				include: {
					user: {
						select: {
							id: true,
							nickName: true,
						},
					},
				},
			});

			if (activeCheckIns.length === 0) {
				return {
					success: true,
					checkedOutCount: 0,
					spaceName: space.name,
				};
			}

			// 모든 체크인을 비활성화
			await tx.spaceCheckIn.updateMany({
				where: {
					spaceId,
					isActive: true,
				},
				data: {
					isActive: false,
				},
			});

			// 알림은 발송하지 않음 (관리자 요청에 따라)

			this.logger.log(
				`관리자 ${authContext.userId}가 ${space.name}(${spaceId})의 모든 사용자 체크아웃 처리 - 대상: ${activeCheckIns.length}명`
			);

			return {
				success: true,
				checkedOutCount: activeCheckIns.length,
				spaceName: space.name,
			};
		});
	}

	@Cron(CronExpression.EVERY_DAY_AT_6AM)
	async resetDailyCheckIns() {
		this.logger.log('매일 오전 6시 체크인 리셋 시작');
		
		try {
			await this.prisma.spaceCheckIn.updateMany({
				where: {
					isActive: true,
				},
				data: {
					isActive: false,
				},
			});

			this.logger.log('체크인 리셋 완료');
		} catch (error) {
			this.logger.error('체크인 리셋 실패:', error);
		}
	}

	@Cron(CronExpression.EVERY_5_MINUTES)
	async checkUserLocations() {
		this.logger.debug('체크인 사용자 위치 확인 시작');

		try {
			const activeCheckIns = await this.prisma.spaceCheckIn.findMany({
				where: {
					isActive: true,
				},
				include: {
					space: true,
				},
			});

			const maxDistance = (await this.systemConfig.get()).maxDistanceFromSpace + 200;

			for (const checkIn of activeCheckIns) {
				const checkInPosition = new GeoPosition(
					checkIn.latitude,
					checkIn.longitude,
				);
				const spacePosition = new GeoPosition(
					checkIn.space.latitude,
					checkIn.space.longitude,
				);

				const distance = Number(checkInPosition.Distance(spacePosition).toFixed(0));

				if (distance > maxDistance) {
					await this.prisma.spaceCheckIn.update({
						where: { id: checkIn.id },
						data: { isActive: false },
					});

					void this.notificationService.sendNotification({
						type: NotificationType.Admin,
						userId: checkIn.userId,
						title: '체크아웃',
						body: `${checkIn.space.name}에서 200m 이상 벗어나 자동 체크아웃되었습니다.`,
					});

					this.logger.log(`사용자 ${checkIn.userId} 자동 체크아웃 - 거리: ${distance}m`);
				}
			}
		} catch (error) {
			this.logger.error('위치 확인 실패:', error);
		}
	}

	@Cron(CronExpression.EVERY_5_MINUTES)
	async autoCheckOutInactiveUsers() {
		this.logger.log('자동 체크아웃 크론잡 시작');
		
		try {
			const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
			
			// 10분 이상 비활성 체크인 찾기
			const inactiveCheckIns = await this.prisma.spaceCheckIn.findMany({
				where: {
					isActive: true,
					lastActivityTime: {
						lt: tenMinutesAgo,
					},
				},
				include: {
					space: {
						select: {
							name: true,
						},
					},
					user: {
						select: {
							id: true,
							nickName: true,
						},
					},
				},
			});

			if (inactiveCheckIns.length === 0) {
				this.logger.log('비활성 체크인 없음');
				return;
			}

			// 자동 체크아웃 처리
			for (const checkIn of inactiveCheckIns) {
				await this.prisma.spaceCheckIn.update({
					where: { id: checkIn.id },
					data: {
						isActive: false,
						autoCheckedOut: true,
					},
				});

				// 로깅
				this.logger.log(
					`자동 체크아웃: ${checkIn.user.nickName || checkIn.user.id} - ${checkIn.space.name}`,
				);

				// 알림 전송
				try {
					await this.notificationService.sendNotification({
						type: NotificationType.Admin,
						userId: checkIn.userId,
						title: '자동 체크아웃',
						body: `${checkIn.space.name}에서 자동으로 체크아웃되었습니다. (10분 이상 비활성)`,
					});
				} catch (notificationError) {
					this.logger.error(
						`알림 전송 실패 - 사용자: ${checkIn.userId}`,
						notificationError,
					);
				}
			}

			this.logger.log(`총 ${inactiveCheckIns.length}명 자동 체크아웃 완료`);
		} catch (error) {
			this.logger.error('자동 체크아웃 크론잡 실패:', error);
		}
	}
}