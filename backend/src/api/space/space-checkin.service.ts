import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GeoPosition } from 'geo-position.ts';

import { CheckInDTO, CheckOutDTO, CheckInUserInfo, CurrentGroupResponse } from '@/api/space/space-checkin.dto';
import { NotificationService } from '@/api/notification/notification.service';
import { NotificationType } from '@/api/notification/notification.types';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SystemConfigService } from '@/modules/system-config/system-config.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

const DEFAULT_CHECK_IN_POINTS = 5;
const GROUP_BONUS_POINTS = 10;
const GROUP_SIZE = 5;

@Injectable()
export class SpaceCheckInService {
	private logger = new Logger(SpaceCheckInService.name);

	constructor(
		private prisma: PrismaService,
		private systemConfig: SystemConfigService,
		private notificationService: NotificationService,
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
		
		const space = await this.prisma.space.findFirst({
			where: { id: spaceId },
		});
		
		if (!space) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

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
			throw new BadRequestException(ErrorCodes.SPACE_OUT_OF_RANGE);
		}

		const existingCheckIn = await this.prisma.spaceCheckIn.findFirst({
			where: {
				userId: authContext.userId,
				spaceId,
				isActive: true,
			},
		});

		if (existingCheckIn) {
			throw new BadRequestException('이미 체크인한 상태입니다');
		}

		let currentGroup = await this.prisma.spaceCheckInGroup.findFirst({
			where: {
				spaceId,
				isCompleted: false,
			},
			include: {
				checkIns: true,
			},
		});

		if (!currentGroup || currentGroup.checkIns.length >= GROUP_SIZE) {
			currentGroup = await this.prisma.spaceCheckInGroup.create({
				data: {
					spaceId,
					requiredMembers: GROUP_SIZE,
					bonusPoints: GROUP_BONUS_POINTS,
				},
				include: {
					checkIns: true,
				},
			});
		}

		const checkIn = await this.prisma.spaceCheckIn.create({
			data: {
				userId: authContext.userId,
				spaceId,
				groupId: currentGroup.id,
				latitude: checkInDTO.latitude,
				longitude: checkInDTO.longitude,
				pointsEarned: DEFAULT_CHECK_IN_POINTS,
			},
		});

		const updatedGroup = await this.prisma.spaceCheckInGroup.findFirst({
			where: { id: currentGroup.id },
			include: {
				checkIns: {
					where: { isActive: true },
				},
			},
		});

		if (updatedGroup && updatedGroup.checkIns.length === GROUP_SIZE && !updatedGroup.isCompleted) {
			await this.prisma.spaceCheckInGroup.update({
				where: { id: updatedGroup.id },
				data: {
					isCompleted: true,
					completedAt: new Date(),
					bonusAwarded: true,
				},
			});

			await Promise.all(
				updatedGroup.checkIns.map(async (checkIn) => {
					await this.prisma.spaceCheckIn.update({
						where: { id: checkIn.id },
						data: {
							pointsEarned: checkIn.pointsEarned + GROUP_BONUS_POINTS,
						},
					});

					void this.notificationService.sendNotification({
						type: NotificationType.Admin,
						userId: checkIn.userId,
						title: '그룹 체크인 완료!',
						body: `5명이 모여 보너스 ${GROUP_BONUS_POINTS} SAV를 획득했습니다!`,
					});
				}),
			);
		}

		void this.notificationService.sendNotification({
			type: NotificationType.Admin,
			userId: authContext.userId,
			title: '체크인 완료',
			body: `${space.name}에 체크인하여 ${DEFAULT_CHECK_IN_POINTS} SAV를 획득했습니다.`,
		});

		return {
			success: true,
			checkInId: checkIn.id,
			groupProgress: `${updatedGroup?.checkIns.length || 1}/${GROUP_SIZE}`,
			earnedPoints: DEFAULT_CHECK_IN_POINTS,
		};
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
				group: {
					include: {
						checkIns: {
							where: { isActive: true },
						},
					},
				},
			},
		});

		if (!checkIn) {
			return {
				isCheckedIn: false,
			};
		}

		return {
			isCheckedIn: true,
			checkedInAt: checkIn.checkedInAt,
			groupProgress: `${checkIn.group?.checkIns.length || 0}/${GROUP_SIZE}`,
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

		const currentGroup = await this.prisma.spaceCheckInGroup.findFirst({
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
		});

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
				progress: `${currentGroup.checkIns.length}/${GROUP_SIZE}`,
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
		const group = await this.prisma.spaceCheckInGroup.findFirst({
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
		});

		if (!group) {
			return null;
		}

		return {
			groupId: group.id,
			progress: `${group.checkIns.length}/${GROUP_SIZE}`,
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
}