import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';

import {
	SendFriendRequestDTO,
	GetFriendsDTO,
	GetSentRequestsDTO,
	SearchFriendsDTO,
} from '@/api/friends/friends.dto';
import { NotificationService } from '@/api/notification/notification.service';
import { NotificationType } from '@/api/notification/notification.types';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class FriendsService {
	private logger = new Logger(FriendsService.name);

	constructor(
		private prisma: PrismaService,
		private notificationService: NotificationService,
	) {}

	// 1. 친구 신청 보내기
	async sendFriendRequest({
		sendFriendRequestDTO,
		request,
	}: {
		sendFriendRequestDTO: SendFriendRequestDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const { addresseeId } = sendFriendRequestDTO;

		// 1. 자기 자신에게 신청 불가
		if (authContext.userId === addresseeId) {
			throw new BadRequestException('자기 자신에게는 친구 신청을 할 수 없습니다');
		}

		// 2. 상대방 존재 확인
		const addressee = await this.prisma.user.findFirst({
			where: { id: addresseeId, deleted: false },
		});

		if (!addressee) {
			throw new NotFoundException(ErrorCodes.USER_DOES_NOT_EXIST);
		}

		// 3. 기존 관계 확인
		const existingFriendship = await this.prisma.friendship.findFirst({
			where: {
				OR: [
					{ requesterId: authContext.userId, addresseeId },
					{ requesterId: addresseeId, addresseeId: authContext.userId },
				],
			},
		});

		if (existingFriendship) {
			if (existingFriendship.status === FriendshipStatus.PENDING) {
				// 역방향 신청이 있으면 자동 수락
				if (existingFriendship.requesterId === addresseeId) {
					await this.prisma.friendship.update({
						where: { id: existingFriendship.id },
						data: { status: FriendshipStatus.ACCEPTED },
					});

					// 양방향 알림
					void this.notificationService.sendNotification({
						type: NotificationType.FriendAccepted,
						userId: addresseeId,
						title: '친구 수락',
						body: `${addressee.nickName || '사용자'}님과 친구가 되었습니다`,
					});

					return {
						success: true,
						friendshipId: existingFriendship.id,
						message: '친구 신청이 자동으로 수락되었습니다',
					};
				}

				throw new BadRequestException('이미 친구 신청을 보냈습니다');
			}

			if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
				throw new BadRequestException('이미 친구입니다');
			}

			if (existingFriendship.status === FriendshipStatus.BLOCKED) {
				throw new BadRequestException('차단된 사용자입니다');
			}

			// REJECTED 상태면 새로 신청 가능 - 기존 레코드 삭제 후 진행
			await this.prisma.friendship.delete({
				where: { id: existingFriendship.id },
			});
		}

		// 4. 새 친구 신청 생성
		const friendship = await this.prisma.friendship.create({
			data: {
				requesterId: authContext.userId,
				addresseeId,
				status: FriendshipStatus.PENDING,
			},
		});

		// 5. 알림 발송
		const requester = await this.prisma.user.findFirst({
			where: { id: authContext.userId },
			select: { nickName: true },
		});

		void this.notificationService.sendNotification({
			type: NotificationType.FriendRequest,
			userId: addresseeId,
			title: '친구 신청',
			body: `${requester?.nickName || '사용자'}님이 친구 신청을 보냈습니다`,
		});

		this.logger.log(`친구 신청: ${authContext.userId} -> ${addresseeId}`);

		return {
			success: true,
			friendshipId: friendship.id,
			message: '친구 신청을 보냈습니다',
		};
	}

	// 2. 친구 신청 수락
	async acceptFriendRequest({
		friendshipId,
		request,
	}: {
		friendshipId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const friendship = await this.prisma.friendship.findFirst({
			where: { id: friendshipId },
			include: {
				requester: {
					select: {
						id: true,
						nickName: true,
					},
				},
			},
		});

		if (!friendship) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		// 본인에게 온 신청인지 확인
		if (friendship.addresseeId !== authContext.userId) {
			throw new BadRequestException('본인에게 온 친구 신청만 수락할 수 있습니다');
		}

		// 현재 상태가 PENDING인지 확인
		if (friendship.status !== FriendshipStatus.PENDING) {
			throw new BadRequestException('대기 중인 친구 신청이 아닙니다');
		}

		// 수락 처리
		await this.prisma.friendship.update({
			where: { id: friendshipId },
			data: { status: FriendshipStatus.ACCEPTED },
		});

		// 신청자에게 알림
		const addressee = await this.prisma.user.findFirst({
			where: { id: authContext.userId },
			select: { nickName: true },
		});

		void this.notificationService.sendNotification({
			type: NotificationType.FriendAccepted,
			userId: friendship.requesterId,
			title: '친구 수락',
			body: `${addressee?.nickName || '사용자'}님이 친구 신청을 수락했습니다`,
		});

		this.logger.log(`친구 신청 수락: ${friendshipId}`);

		return {
			success: true,
			message: '친구 신청을 수락했습니다',
		};
	}

	// 3. 친구 신청 거절
	async rejectFriendRequest({
		friendshipId,
		request,
	}: {
		friendshipId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const friendship = await this.prisma.friendship.findFirst({
			where: { id: friendshipId },
		});

		if (!friendship) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		// 본인에게 온 신청인지 확인
		if (friendship.addresseeId !== authContext.userId) {
			throw new BadRequestException('본인에게 온 친구 신청만 거절할 수 있습니다');
		}

		// 현재 상태가 PENDING인지 확인
		if (friendship.status !== FriendshipStatus.PENDING) {
			throw new BadRequestException('대기 중인 친구 신청이 아닙니다');
		}

		// 거절 처리
		await this.prisma.friendship.update({
			where: { id: friendshipId },
			data: { status: FriendshipStatus.REJECTED },
		});

		this.logger.log(`친구 신청 거절: ${friendshipId}`);

		return {
			success: true,
			message: '친구 신청을 거절했습니다',
		};
	}

	// 4. 친구 목록 조회
	async getFriends({
		getFriendsDTO,
		request,
	}: {
		getFriendsDTO: GetFriendsDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const { page = 1, limit = 20 } = getFriendsDTO;
		const skip = (page - 1) * limit;

		// 양방향 친구 조회 (내가 requester이거나 addressee인 경우)
		const where = {
			status: FriendshipStatus.ACCEPTED,
			OR: [
				{ requesterId: authContext.userId },
				{ addresseeId: authContext.userId },
			],
		};

		const [friendships, total] = await Promise.all([
			this.prisma.friendship.findMany({
				where,
				include: {
					requester: {
						select: {
							id: true,
							nickName: true,
							finalProfileImageUrl: true,
							introduction: true,
						},
					},
					addressee: {
						select: {
							id: true,
							nickName: true,
							finalProfileImageUrl: true,
							introduction: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			this.prisma.friendship.count({ where }),
		]);

		const friends = friendships.map((friendship) => {
			// 상대방 정보 추출
			const friend =
				friendship.requesterId === authContext.userId
					? friendship.addressee
					: friendship.requester;

			return {
				id: friendship.id,
				status: friendship.status,
				createdAt: friendship.createdAt,
				friend: {
					userId: friend.id,
					nickName: friend.nickName || undefined,
					profileImageUrl: friend.finalProfileImageUrl || undefined,
					introduction: friend.introduction || undefined,
				},
			};
		});

		return {
			friends,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	// 5. 받은 친구 신청 목록
	async getReceivedRequests({
		getFriendsDTO,
		request,
	}: {
		getFriendsDTO: GetFriendsDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const { page = 1, limit = 20 } = getFriendsDTO;
		const skip = (page - 1) * limit;

		const where = {
			addresseeId: authContext.userId,
			status: FriendshipStatus.PENDING,
		};

		const [friendships, total] = await Promise.all([
			this.prisma.friendship.findMany({
				where,
				include: {
					requester: {
						select: {
							id: true,
							nickName: true,
							finalProfileImageUrl: true,
							introduction: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			this.prisma.friendship.count({ where }),
		]);

		const requests = friendships.map((friendship) => ({
			id: friendship.id,
			status: friendship.status,
			createdAt: friendship.createdAt,
			requester: {
				userId: friendship.requester.id,
				nickName: friendship.requester.nickName || undefined,
				profileImageUrl: friendship.requester.finalProfileImageUrl || undefined,
				introduction: friendship.requester.introduction || undefined,
			},
		}));

		return {
			requests,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	// 6. 보낸 친구 신청 목록
	async getSentRequests({
		getSentRequestsDTO,
		request,
	}: {
		getSentRequestsDTO: GetSentRequestsDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const { status, page = 1, limit = 20 } = getSentRequestsDTO;
		const skip = (page - 1) * limit;

		const where: any = {
			requesterId: authContext.userId,
		};

		if (status) {
			where.status = status;
		}

		const [friendships, total] = await Promise.all([
			this.prisma.friendship.findMany({
				where,
				include: {
					addressee: {
						select: {
							id: true,
							nickName: true,
							finalProfileImageUrl: true,
							introduction: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			this.prisma.friendship.count({ where }),
		]);

		const requests = friendships.map((friendship) => ({
			id: friendship.id,
			status: friendship.status,
			createdAt: friendship.createdAt,
			addressee: {
				userId: friendship.addressee.id,
				nickName: friendship.addressee.nickName || undefined,
				profileImageUrl: friendship.addressee.finalProfileImageUrl || undefined,
				introduction: friendship.addressee.introduction || undefined,
			},
		}));

		return {
			requests,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	// 7. 친구 삭제
	async deleteFriend({
		friendshipId,
		request,
	}: {
		friendshipId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const friendship = await this.prisma.friendship.findFirst({
			where: { id: friendshipId },
		});

		if (!friendship) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		// 본인이 포함된 관계인지 확인
		if (
			friendship.requesterId !== authContext.userId &&
			friendship.addresseeId !== authContext.userId
		) {
			throw new BadRequestException('본인의 친구 관계만 삭제할 수 있습니다');
		}

		// ACCEPTED 상태인지 확인
		if (friendship.status !== FriendshipStatus.ACCEPTED) {
			throw new BadRequestException('친구 관계만 삭제할 수 있습니다');
		}

		// Hard delete
		await this.prisma.friendship.delete({
			where: { id: friendshipId },
		});

		this.logger.log(`친구 삭제: ${friendshipId}`);

		return {
			success: true,
			message: '친구를 삭제했습니다',
		};
	}

	// 8. 사용자 차단
	async blockUser({
		userId,
		request,
	}: {
		userId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		// 자기 자신 차단 불가
		if (authContext.userId === userId) {
			throw new BadRequestException('자기 자신을 차단할 수 없습니다');
		}

		// 사용자 존재 확인
		const user = await this.prisma.user.findFirst({
			where: { id: userId, deleted: false },
		});

		if (!user) {
			throw new NotFoundException(ErrorCodes.USER_DOES_NOT_EXIST);
		}

		// 기존 관계 확인
		const existingFriendship = await this.prisma.friendship.findFirst({
			where: {
				OR: [
					{ requesterId: authContext.userId, addresseeId: userId },
					{ requesterId: userId, addresseeId: authContext.userId },
				],
			},
		});

		if (existingFriendship) {
			// 기존 관계를 BLOCKED로 업데이트
			await this.prisma.friendship.update({
				where: { id: existingFriendship.id },
				data: { status: FriendshipStatus.BLOCKED },
			});
		} else {
			// 새로 생성
			await this.prisma.friendship.create({
				data: {
					requesterId: authContext.userId,
					addresseeId: userId,
					status: FriendshipStatus.BLOCKED,
				},
			});
		}

		this.logger.log(`사용자 차단: ${authContext.userId} -> ${userId}`);

		return {
			success: true,
			message: '사용자를 차단했습니다',
		};
	}

	// 9. 차단 해제
	async unblockUser({
		userId,
		request,
	}: {
		userId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const friendship = await this.prisma.friendship.findFirst({
			where: {
				OR: [
					{ requesterId: authContext.userId, addresseeId: userId },
					{ requesterId: userId, addresseeId: authContext.userId },
				],
				status: FriendshipStatus.BLOCKED,
			},
		});

		if (!friendship) {
			throw new NotFoundException('차단한 사용자가 아닙니다');
		}

		// 삭제
		await this.prisma.friendship.delete({
			where: { id: friendship.id },
		});

		this.logger.log(`차단 해제: ${friendship.id}`);

		return {
			success: true,
			message: '차단을 해제했습니다',
		};
	}

	// 10. 친구 검색
	async searchFriends({
		searchFriendsDTO,
		request,
	}: {
		searchFriendsDTO: SearchFriendsDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const { query, page = 1, limit = 20 } = searchFriendsDTO;
		const skip = (page - 1) * limit;

		// 친구 관계에서 검색
		const friendships = await this.prisma.friendship.findMany({
			where: {
				status: FriendshipStatus.ACCEPTED,
				OR: [
					{
						requesterId: authContext.userId,
						addressee: {
							nickName: {
								contains: query,
								mode: 'insensitive',
							},
						},
					},
					{
						addresseeId: authContext.userId,
						requester: {
							nickName: {
								contains: query,
								mode: 'insensitive',
							},
						},
					},
				],
			},
			include: {
				requester: {
					select: {
						id: true,
						nickName: true,
						finalProfileImageUrl: true,
						introduction: true,
					},
				},
				addressee: {
					select: {
						id: true,
						nickName: true,
						finalProfileImageUrl: true,
						introduction: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take: limit,
		});

		const total = friendships.length;

		const friends = friendships.map((friendship) => {
			const friend =
				friendship.requesterId === authContext.userId
					? friendship.addressee
					: friendship.requester;

			return {
				id: friendship.id,
				status: friendship.status,
				createdAt: friendship.createdAt,
				friend: {
					userId: friend.id,
					nickName: friend.nickName || undefined,
					profileImageUrl: friend.finalProfileImageUrl || undefined,
					introduction: friend.introduction || undefined,
				},
			};
		});

		return {
			friends,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	// 11. 친구 통계
	async getFriendStats({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const [totalFriends, receivedRequests, sentRequests] = await Promise.all([
			this.prisma.friendship.count({
				where: {
					status: FriendshipStatus.ACCEPTED,
					OR: [
						{ requesterId: authContext.userId },
						{ addresseeId: authContext.userId },
					],
				},
			}),
			this.prisma.friendship.count({
				where: {
					addresseeId: authContext.userId,
					status: FriendshipStatus.PENDING,
				},
			}),
			this.prisma.friendship.count({
				where: {
					requesterId: authContext.userId,
					status: FriendshipStatus.PENDING,
				},
			}),
		]);

		return {
			totalFriends,
			receivedRequests,
			sentRequests,
		};
	}
}
