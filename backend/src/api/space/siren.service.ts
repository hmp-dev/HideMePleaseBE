import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GeoPosition } from 'geo-position.ts';

import { CreateSirenDTO, GetSirensDTO, SirenSortBy } from '@/api/space/siren.dto';
import { PointService } from '@/api/points/point.service';
import { PointSource, PointTransactionType } from '@/api/points/point.types';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { MediaService } from '@/modules/media/media.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

// 만료일에 따른 포인트 계산 (시간 단위)
function calculatePointsForDuration(expiresAt: Date): number {
	const now = new Date();
	const diffInMs = expiresAt.getTime() - now.getTime();
	const diffInHours = diffInMs / (1000 * 60 * 60);
	const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

	// 최소 3시간 체크
	if (diffInHours < 3) {
		throw new BadRequestException('만료일은 최소 3시간 이후여야 합니다');
	}

	// 최대 30일 체크
	if (diffInDays > 30) {
		throw new BadRequestException('만료일은 최대 30일까지만 설정할 수 있습니다');
	}

	// 시간 단위 포인트 정책
	if (diffInHours <= 3) return 1;
	if (diffInHours <= 9) return 2;
	if (diffInHours <= 24) return 5;

	// 24시간 초과: 일당 5포인트 (올림 처리)
	const days = Math.ceil(diffInHours / 24);
	return days * 5;
}

// 남은 일수 계산
function calculateRemainingDays(expiresAt: Date): number {
	const now = new Date();
	const diffInMs = expiresAt.getTime() - now.getTime();
	return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
}

const MAX_ACTIVE_SIRENS_PER_USER_PER_SPACE = 3;

@Injectable()
export class SirenService {
	private logger = new Logger(SirenService.name);

	constructor(
		private prisma: PrismaService,
		private pointService: PointService,
		private mediaService: MediaService,
	) {}

	async createSiren({
		createSirenDTO,
		request,
	}: {
		createSirenDTO: CreateSirenDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const { spaceId, message, expiresAt: expiresAtString } = createSirenDTO;

		// 1. 매장 존재 확인
		const space = await this.prisma.space.findFirst({
			where: { id: spaceId, deleted: false },
		});

		if (!space) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		// 2. 만료일 검증
		const expiresAt = new Date(expiresAtString);
		const now = new Date();

		if (expiresAt <= now) {
			throw new BadRequestException('만료일은 현재 시간보다 미래여야 합니다');
		}

		// 3. 포인트 계산
		const pointsRequired = calculatePointsForDuration(expiresAt);

		// 4. 메시지 길이 검증 (DTO에서도 검증하지만 추가 확인)
		if (message.length < 1 || message.length > 500) {
			throw new BadRequestException('메시지는 1자 이상 500자 이하여야 합니다');
		}

		// 5. 동일 매장에 동일 사용자의 활성 사이렌 개수 확인
		const activeCount = await this.prisma.spaceSiren.count({
			where: {
				spaceId,
				userId: authContext.userId,
				isActive: true,
				deleted: false,
				expiresAt: { gt: now },
			},
		});

		if (activeCount >= MAX_ACTIVE_SIRENS_PER_USER_PER_SPACE) {
			throw new BadRequestException(
				`동일 매장에는 최대 ${MAX_ACTIVE_SIRENS_PER_USER_PER_SPACE}개까지만 활성 사이렌을 남길 수 있습니다`,
			);
		}

		// 6. 트랜잭션으로 포인트 차감 및 사이렌 생성
		return await this.prisma.$transaction(async (tx) => {
			// 포인트 차감
			await this.pointService.spendPoints({
				userId: authContext.userId,
				amount: pointsRequired,
				type: PointTransactionType.SPENT,
				source: PointSource.SIREN_POST,
				description: `${space.name}에 사이렌 등록`,
				referenceType: 'space_siren',
			});

			// 사이렌 생성
			const siren = await tx.spaceSiren.create({
				data: {
					spaceId,
					userId: authContext.userId,
					message,
					expiresAt,
					pointsSpent: pointsRequired,
				},
			});

			// 최종 잔액 조회
			const balance = await this.pointService.getOrCreateBalance(authContext.userId, tx);

			this.logger.log(
				`사이렌 생성: 사용자=${authContext.userId}, 매장=${space.name}, 포인트=${pointsRequired}`,
			);

			return {
				success: true,
				sirenId: siren.id,
				pointsSpent: pointsRequired,
				remainingBalance: balance.availableBalance,
			};
		});
	}

	async getSirens({
		getSirensDTO,
	}: {
		getSirensDTO: GetSirensDTO;
		request: Request;
	}) {
		const { sortBy, latitude, longitude, page = 1, limit = 20, spaceId } = getSirensDTO;

		// 거리순 정렬 시 위도/경도 필수
		if (sortBy === SirenSortBy.DISTANCE && (!latitude || !longitude)) {
			throw new BadRequestException('거리순 정렬에는 위도와 경도가 필수입니다');
		}

		const now = new Date();
		const skip = (page - 1) * limit;

		// 기본 where 조건
		const where: any = {
			isActive: true,
			deleted: false,
			expiresAt: { gt: now },
		};

		if (spaceId) {
			where.spaceId = spaceId;
		}

		// 전체 개수 조회
		const total = await this.prisma.spaceSiren.count({ where });

		// 사이렌 조회
		const sirens = await this.prisma.spaceSiren.findMany({
			where,
			include: {
				space: {
					select: {
						id: true,
						name: true,
						nameEn: true,
						latitude: true,
						longitude: true,
						category: true,
						image: {
							select: {
								id: true,
								filename_download: true,
								filename_disk: true,
							},
						},
					},
				},
				user: {
					select: {
						id: true,
						nickName: true,
						finalProfileImageUrl: true,
					},
				},
			},
			orderBy: sortBy === SirenSortBy.TIME ? { createdAt: 'desc' } : undefined,
			// 거리순 정렬은 나중에 처리
		});

		// 거리 계산 및 정렬
		let processedSirens = sirens.map((siren) => {
			const sirenData: any = {
				id: siren.id,
				message: siren.message,
				createdAt: siren.createdAt,
				expiresAt: siren.expiresAt,
				pointsSpent: siren.pointsSpent,
				remainingDays: calculateRemainingDays(siren.expiresAt),
				space: {
					id: siren.space.id,
					name: siren.space.name,
					nameEn: siren.space.nameEn,
					image: siren.space.image
						? this.mediaService.getUrl(siren.space.image as any)
						: null,
					latitude: siren.space.latitude,
					longitude: siren.space.longitude,
					category: siren.space.category,
				},
				author: {
					userId: siren.user.id,
					nickName: siren.user.nickName || undefined,
					profileImageUrl: siren.user.finalProfileImageUrl || undefined,
				},
			};

			// 거리순 정렬인 경우 거리 계산
			if (sortBy === SirenSortBy.DISTANCE && latitude && longitude) {
				const userPosition = new GeoPosition(latitude, longitude);
				const spacePosition = new GeoPosition(siren.space.latitude, siren.space.longitude);
				sirenData.distance = Number(userPosition.Distance(spacePosition).toFixed(0));
			}

			return sirenData;
		});

		// 거리순 정렬
		if (sortBy === SirenSortBy.DISTANCE) {
			processedSirens.sort((a, b) => (a.distance || 0) - (b.distance || 0));
		}

		// 페이지네이션 적용
		const paginatedSirens = processedSirens.slice(skip, skip + limit);

		return {
			sirens: paginatedSirens,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async getMySirens({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const sirens = await this.prisma.spaceSiren.findMany({
			where: {
				userId: authContext.userId,
				deleted: false,
			},
			include: {
				space: {
					select: {
						id: true,
						name: true,
						nameEn: true,
						latitude: true,
						longitude: true,
						category: true,
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
			orderBy: { createdAt: 'desc' },
		});

		const now = new Date();

		return sirens.map((siren) => ({
			id: siren.id,
			message: siren.message,
			createdAt: siren.createdAt,
			expiresAt: siren.expiresAt,
			pointsSpent: siren.pointsSpent,
			isActive: siren.isActive && siren.expiresAt > now,
			remainingDays: calculateRemainingDays(siren.expiresAt),
			space: {
				id: siren.space.id,
				name: siren.space.name,
				nameEn: siren.space.nameEn,
				image: siren.space.image
					? this.mediaService.getUrl(siren.space.image as any)
					: null,
				latitude: siren.space.latitude,
				longitude: siren.space.longitude,
				category: siren.space.category,
			},
		}));
	}

	async deleteSiren({
		sirenId,
		request,
	}: {
		sirenId: string;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const siren = await this.prisma.spaceSiren.findFirst({
			where: { id: sirenId },
		});

		if (!siren) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		// 본인 확인
		if (siren.userId !== authContext.userId) {
			throw new BadRequestException('본인의 사이렌만 삭제할 수 있습니다');
		}

		// Soft delete
		await this.prisma.spaceSiren.update({
			where: { id: sirenId },
			data: {
				deleted: true,
				isActive: false,
			},
		});

		this.logger.log(`사이렌 삭제: ID=${sirenId}, 사용자=${authContext.userId}`);

		return { success: true };
	}

	async getSirenStats({ spaceId }: { spaceId: string }) {
		const space = await this.prisma.space.findFirst({
			where: { id: spaceId },
		});

		if (!space) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		const now = new Date();

		const [activeSirensCount, totalSirensCount] = await Promise.all([
			this.prisma.spaceSiren.count({
				where: {
					spaceId,
					isActive: true,
					deleted: false,
					expiresAt: { gt: now },
				},
			}),
			this.prisma.spaceSiren.count({
				where: {
					spaceId,
					deleted: false,
				},
			}),
		]);

		return {
			activeSirensCount,
			totalSirensCount,
		};
	}

	// 크론잡: 만료된 사이렌 비활성화 (매 시간)
	@Cron(CronExpression.EVERY_HOUR)
	async deactivateExpiredSirens() {
		this.logger.log('만료된 사이렌 비활성화 크론잡 시작');

		try {
			const now = new Date();

			const result = await this.prisma.spaceSiren.updateMany({
				where: {
					isActive: true,
					expiresAt: { lte: now },
				},
				data: {
					isActive: false,
				},
			});

			this.logger.log(`만료된 사이렌 ${result.count}개 비활성화 완료`);
		} catch (error) {
			this.logger.error('만료된 사이렌 비활성화 실패:', error);
		}
	}
}
