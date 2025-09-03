import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PointSource, PointTransactionType } from '@/api/points/point.types';
import { PrismaService } from '@/modules/prisma/prisma.service';

export interface CreatePointTransactionDto {
	userId: string;
	amount: number;
	type: PointTransactionType;
	source: PointSource;
	description: string;
	referenceId?: string;
	referenceType?: string;
	metadata?: any;
}

export interface PointBalanceDto {
	userId: string;
	totalBalance: number;
	availableBalance: number;
	lockedBalance: number;
	lifetimeEarned: number;
	lifetimeSpent: number;
}

@Injectable()
export class PointService {
	private logger = new Logger(PointService.name);

	constructor(private prisma: PrismaService) {}

	async getOrCreateBalance(userId: string): Promise<PointBalanceDto> {
		let balance = await this.prisma.userPointBalance.findUnique({
			where: { userId },
		});

		if (!balance) {
			balance = await this.prisma.userPointBalance.create({
				data: { userId },
			});
		}

		return balance;
	}

	async earnPoints(dto: CreatePointTransactionDto): Promise<PointBalanceDto> {
		if (dto.amount <= 0) {
			throw new BadRequestException('획득 포인트는 0보다 커야 합니다');
		}

		return await this.prisma.$transaction(async (tx) => {
			const currentBalance = await this.getOrCreateBalance(dto.userId);
			
			const newTotalBalance = currentBalance.totalBalance + dto.amount;
			const newAvailableBalance = currentBalance.availableBalance + dto.amount;
			const newLifetimeEarned = currentBalance.lifetimeEarned + dto.amount;

			await (tx as any).pointTransaction.create({
				data: {
					userId: dto.userId,
					amount: dto.amount,
					type: PointTransactionType.EARNED,
					source: dto.source,
					description: dto.description,
					referenceId: dto.referenceId,
					referenceType: dto.referenceType,
					balanceBefore: currentBalance.totalBalance,
					balanceAfter: newTotalBalance,
					metadata: dto.metadata,
				},
			});

			const updatedBalance = await (tx as any).userPointBalance.update({
				where: { userId: dto.userId },
				data: {
					totalBalance: newTotalBalance,
					availableBalance: newAvailableBalance,
					lifetimeEarned: newLifetimeEarned,
				},
			});

			this.logger.log(
				`사용자 ${dto.userId}가 ${dto.amount} 포인트 획득 (${dto.source})`,
			);

			return updatedBalance;
		});
	}

	async spendPoints(dto: CreatePointTransactionDto): Promise<PointBalanceDto> {
		if (dto.amount <= 0) {
			throw new BadRequestException('사용 포인트는 0보다 커야 합니다');
		}

		return await this.prisma.$transaction(async (tx) => {
			const currentBalance = await this.getOrCreateBalance(dto.userId);
			
			if (currentBalance.availableBalance < dto.amount) {
				throw new BadRequestException('포인트가 부족합니다');
			}

			const newTotalBalance = currentBalance.totalBalance - dto.amount;
			const newAvailableBalance = currentBalance.availableBalance - dto.amount;
			const newLifetimeSpent = currentBalance.lifetimeSpent + dto.amount;

			await (tx as any).pointTransaction.create({
				data: {
					userId: dto.userId,
					amount: -dto.amount,
					type: PointTransactionType.SPENT,
					source: dto.source,
					description: dto.description,
					referenceId: dto.referenceId,
					referenceType: dto.referenceType,
					balanceBefore: currentBalance.totalBalance,
					balanceAfter: newTotalBalance,
					metadata: dto.metadata,
				},
			});

			const updatedBalance = await (tx as any).userPointBalance.update({
				where: { userId: dto.userId },
				data: {
					totalBalance: newTotalBalance,
					availableBalance: newAvailableBalance,
					lifetimeSpent: newLifetimeSpent,
				},
			});

			this.logger.log(
				`사용자 ${dto.userId}가 ${dto.amount} 포인트 사용 (${dto.source})`,
			);

			return updatedBalance;
		});
	}

	async lockPoints(userId: string, amount: number, reason: string): Promise<PointBalanceDto> {
		if (amount <= 0) {
			throw new BadRequestException('잠금 포인트는 0보다 커야 합니다');
		}

		return await this.prisma.$transaction(async (tx) => {
			const currentBalance = await this.getOrCreateBalance(userId);
			
			if (currentBalance.availableBalance < amount) {
				throw new BadRequestException('잠금할 포인트가 부족합니다');
			}

			const newAvailableBalance = currentBalance.availableBalance - amount;
			const newLockedBalance = currentBalance.lockedBalance + amount;

			await (tx as any).pointTransaction.create({
				data: {
					userId,
					amount: 0,
					type: PointTransactionType.LOCKED,
					source: PointSource.OTHER,
					description: reason,
					balanceBefore: currentBalance.totalBalance,
					balanceAfter: currentBalance.totalBalance,
				},
			});

			return await (tx as any).userPointBalance.update({
				where: { userId },
				data: {
					availableBalance: newAvailableBalance,
					lockedBalance: newLockedBalance,
				},
			});
		});
	}

	async unlockPoints(userId: string, amount: number, reason: string): Promise<PointBalanceDto> {
		if (amount <= 0) {
			throw new BadRequestException('해제 포인트는 0보다 커야 합니다');
		}

		return await this.prisma.$transaction(async (tx) => {
			const currentBalance = await this.getOrCreateBalance(userId);
			
			if (currentBalance.lockedBalance < amount) {
				throw new BadRequestException('해제할 포인트가 부족합니다');
			}

			const newAvailableBalance = currentBalance.availableBalance + amount;
			const newLockedBalance = currentBalance.lockedBalance - amount;

			await (tx as any).pointTransaction.create({
				data: {
					userId,
					amount: 0,
					type: PointTransactionType.UNLOCKED,
					source: PointSource.OTHER,
					description: reason,
					balanceBefore: currentBalance.totalBalance,
					balanceAfter: currentBalance.totalBalance,
				},
			});

			return await (tx as any).userPointBalance.update({
				where: { userId },
				data: {
					availableBalance: newAvailableBalance,
					lockedBalance: newLockedBalance,
				},
			});
		});
	}

	async getTransactionHistory(
		userId: string,
		page = 1,
		limit = 20,
		source?: PointSource,
		type?: PointTransactionType,
	) {
		const skip = (page - 1) * limit;

		const where: any = {
			userId,
			...(source && { source }),
			...(type && { type }),
		};

		const [transactions, total] = await Promise.all([
			(this.prisma as any).pointTransaction.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			(this.prisma as any).pointTransaction.count({ where }),
		]);

		return {
			transactions,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async getPointSummary(userId: string) {
		const balance = await this.getOrCreateBalance(userId);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const thisMonth = new Date();
		thisMonth.setDate(1);
		thisMonth.setHours(0, 0, 0, 0);

		const [todayEarned, monthlyEarned, todaySpent, monthlySpent] = await Promise.all([
			(this.prisma as any).pointTransaction.aggregate({
				where: {
					userId,
					type: PointTransactionType.EARNED,
					createdAt: { gte: today },
				},
				_sum: { amount: true },
			}),
			(this.prisma as any).pointTransaction.aggregate({
				where: {
					userId,
					type: PointTransactionType.EARNED,
					createdAt: { gte: thisMonth },
				},
				_sum: { amount: true },
			}),
			(this.prisma as any).pointTransaction.aggregate({
				where: {
					userId,
					type: PointTransactionType.SPENT,
					createdAt: { gte: today },
				},
				_sum: { amount: true },
			}),
			(this.prisma as any).pointTransaction.aggregate({
				where: {
					userId,
					type: PointTransactionType.SPENT,
					createdAt: { gte: thisMonth },
				},
				_sum: { amount: true },
			}),
		]);

		return {
			balance,
			today: {
				earned: todayEarned._sum.amount || 0,
				spent: Math.abs(todaySpent._sum.amount || 0),
			},
			thisMonth: {
				earned: monthlyEarned._sum.amount || 0,
				spent: Math.abs(monthlySpent._sum.amount || 0),
			},
		};
	}

	async refundPoints(
		userId: string,
		originalTransactionId: string,
		reason: string,
	): Promise<PointBalanceDto> {
		const originalTransaction = await (this.prisma as any).pointTransaction.findUnique({
			where: { id: originalTransactionId },
		});

		if (!originalTransaction) {
			throw new NotFoundException('원 거래를 찾을 수 없습니다');
		}

		if (originalTransaction.type !== PointTransactionType.SPENT) {
			throw new BadRequestException('사용 거래만 환불할 수 있습니다');
		}

		const refundAmount = Math.abs(originalTransaction.amount);

		return await this.earnPoints({
			userId,
			amount: refundAmount,
			type: PointTransactionType.REFUND,
			source: PointSource.REFUND,
			description: `환불: ${reason}`,
			referenceId: originalTransactionId,
			referenceType: 'refund',
		});
	}

	async adjustPoints(
		userId: string,
		amount: number,
		reason: string,
		adminId: string,
	): Promise<PointBalanceDto> {
		if (amount === 0) {
			throw new BadRequestException('조정 금액은 0이 아니어야 합니다');
		}

		if (amount > 0) {
			return await this.earnPoints({
				userId,
				amount,
				type: PointTransactionType.ADJUSTMENT,
				source: PointSource.ADMIN_GRANT,
				description: reason,
				metadata: { adminId },
			});
		} else {
			return await this.spendPoints({
				userId,
				amount: Math.abs(amount),
				type: PointTransactionType.ADJUSTMENT,
				source: PointSource.ADMIN_DEDUCT,
				description: reason,
				metadata: { adminId },
			});
		}
	}
}