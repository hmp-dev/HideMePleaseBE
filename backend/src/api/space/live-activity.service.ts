import { Injectable, Logger } from '@nestjs/common';

import {
	FirebaseService,
	LiveActivityContentState,
} from '@/modules/firebase/firebase.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class LiveActivityService {
	private readonly logger = new Logger(LiveActivityService.name);

	constructor(
		private prisma: PrismaService,
		private firebaseService: FirebaseService,
	) {}

	// Live Activity 토큰 등록/갱신
	async registerLiveActivityToken({
		userId,
		liveActivityToken,
	}: {
		userId: string;
		liveActivityToken: string;
	}): Promise<void> {
		await this.prisma.user.update({
			where: { id: userId },
			data: {
				liveActivityToken,
				liveActivityTokenUpdatedAt: new Date(),
			},
		});
		this.logger.log(`Live Activity 토큰 등록: userId=${userId}`);
	}

	// Live Activity 토큰 제거
	async removeLiveActivityToken(userId: string): Promise<void> {
		await this.prisma.user.update({
			where: { id: userId },
			data: {
				liveActivityToken: null,
				liveActivityTokenUpdatedAt: null,
			},
		});
		this.logger.log(`Live Activity 토큰 제거: userId=${userId}`);
	}

	// 그룹 멤버들에게 Live Activity 업데이트 전송
	async notifyGroupUpdate({
		groupId,
		spaceId,
		spaceName,
	}: {
		groupId: string;
		spaceId: string;
		spaceName: string;
	}): Promise<void> {
		// 그룹의 활성 체크인 멤버들 조회
		const group = await this.prisma.spaceCheckInGroup.findUnique({
			where: { id: groupId },
			include: {
				checkIns: {
					where: { isActive: true },
					include: {
						user: {
							select: {
								id: true,
								liveActivityToken: true,
							},
						},
					},
				},
			},
		});

		if (!group) {
			this.logger.warn(`그룹을 찾을 수 없음: groupId=${groupId}`);
			return;
		}

		const currentMembers = group.checkIns.length;
		const requiredMembers = group.requiredMembers;
		const isCompleted = currentMembers >= requiredMembers;

		// Live Activity 토큰이 있는 멤버들에게 업데이트 전송
		const updatePromises = group.checkIns
			.filter((checkIn) => checkIn.user.liveActivityToken)
			.map(async (checkIn) => {
				const elapsedMinutes = Math.floor(
					(Date.now() - checkIn.checkedInAt.getTime()) / (1000 * 60),
				);

				const contentState: LiveActivityContentState = {
					groupProgress: `${currentMembers}/${requiredMembers}`,
					currentMembers,
					requiredMembers,
					checkedInAt: checkIn.checkedInAt.toISOString(),
					elapsedMinutes,
					spaceName,
					spaceId,
					isCompleted,
					bonusPoints: isCompleted ? group.bonusPoints : undefined,
				};

				return this.firebaseService.sendLiveActivityUpdate({
					liveActivityToken: checkIn.user.liveActivityToken!,
					contentState,
					event: isCompleted ? 'end' : 'update',
					dismissalDate: isCompleted
						? new Date(Date.now() + 30 * 60 * 1000) // 완료 시 30분 후 자동 종료
						: undefined,
				});
			});

		await Promise.allSettled(updatePromises);
		this.logger.log(
			`Live Activity 업데이트 전송 완료: groupId=${groupId}, members=${currentMembers}/${requiredMembers}`,
		);
	}

	// 특정 사용자의 Live Activity 종료
	async endUserLiveActivity({
		userId,
		spaceId,
		spaceName,
		reason,
		checkInData,
	}: {
		userId: string;
		spaceId: string;
		spaceName: string;
		reason: 'checkout' | 'auto_checkout' | 'daily_reset';
		checkInData?: {
			checkedInAt: Date;
			groupId?: string | null;
		};
	}): Promise<void> {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { liveActivityToken: true },
		});

		if (!user?.liveActivityToken) {
			return;
		}

		// 그룹 정보 조회 (있는 경우)
		let groupProgress = '0/5';
		let currentMembers = 0;
		let requiredMembers = 5;
		let isCompleted = false;
		let bonusPoints: number | undefined;

		if (checkInData?.groupId) {
			const group = await this.prisma.spaceCheckInGroup.findUnique({
				where: { id: checkInData.groupId },
				include: { checkIns: { where: { isActive: true } } },
			});
			if (group) {
				currentMembers = group.checkIns.length;
				requiredMembers = group.requiredMembers;
				groupProgress = `${currentMembers}/${requiredMembers}`;
				isCompleted = currentMembers >= requiredMembers;
				bonusPoints = isCompleted ? group.bonusPoints : undefined;
			}
		}

		const elapsedMinutes = checkInData?.checkedInAt
			? Math.floor(
					(Date.now() - checkInData.checkedInAt.getTime()) / (1000 * 60),
				)
			: 0;

		const contentState: LiveActivityContentState = {
			groupProgress,
			currentMembers,
			requiredMembers,
			checkedInAt:
				checkInData?.checkedInAt?.toISOString() ?? new Date().toISOString(),
			elapsedMinutes,
			spaceName,
			spaceId,
			isCompleted,
			bonusPoints,
		};

		await this.firebaseService.endLiveActivity({
			liveActivityToken: user.liveActivityToken,
			contentState,
			dismissalDate: new Date(Date.now() + 5 * 60 * 1000), // 5분 후 종료
		});

		this.logger.log(`Live Activity 종료: userId=${userId}, reason=${reason}`);
	}

	// 여러 사용자의 Live Activity 일괄 종료 (일일 리셋용)
	async endMultipleUserLiveActivities(
		users: {
			userId: string;
			spaceId: string;
			spaceName: string;
			checkInData?: {
				checkedInAt: Date;
				groupId?: string | null;
			};
		}[],
	): Promise<void> {
		const endPromises = users.map((user) =>
			this.endUserLiveActivity({
				userId: user.userId,
				spaceId: user.spaceId,
				spaceName: user.spaceName,
				reason: 'daily_reset',
				checkInData: user.checkInData,
			}).catch((error) => {
				this.logger.error(
					`Live Activity 종료 실패: userId=${user.userId}`,
					error,
				);
			}),
		);

		await Promise.allSettled(endPromises);
		this.logger.log(
			`Live Activity 일괄 종료 완료: ${users.length}명 처리`,
		);
	}
}
