import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';

import { PointSource, PointTransactionType } from '@/api/points/point.types';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { ErrorCodes } from '@/utils/errorCodes';

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

	async getOrCreateBalance(userId: string, tx?: any): Promise<PointBalanceDto> {
		const prisma = tx || this.prisma;
		
		let balance = await prisma.userPointBalance.findUnique({
			where: { userId },
		});

		if (!balance) {
			balance = await prisma.userPointBalance.create({
				data: { userId },
			});
		}

		return balance;
	}

	async earnPoints(dto: CreatePointTransactionDto, tx?: any): Promise<PointBalanceDto> {
		if (dto.amount <= 0) {
			throw new BadRequestException(ErrorCodes.POINT_INVALID_AMOUNT);
		}

		// 외부에서 트랜잭션이 전달되면 사용, 아니면 새로 생성
		const executeTransaction = async (prisma: any) => {
			const currentBalance = await this.getOrCreateBalance(dto.userId, prisma);
			
			const newTotalBalance = currentBalance.totalBalance + dto.amount;
			const newAvailableBalance = currentBalance.availableBalance + dto.amount;
			const newLifetimeEarned = currentBalance.lifetimeEarned + dto.amount;

			await prisma.pointTransaction.create({
				data: {
					userId: dto.userId,
					amount: dto.amount,
					type: dto.type || PointTransactionType.EARNED,
					source: dto.source,
					description: dto.description,
					referenceId: dto.referenceId,
					referenceType: dto.referenceType,
					balanceBefore: currentBalance.totalBalance,
					balanceAfter: newTotalBalance,
					metadata: dto.metadata,
				},
			});

			const updatedBalance = await prisma.userPointBalance.update({
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
		};

		// tx가 전달되면 그대로 사용, 아니면 새 트랜잭션 생성
		if (tx) {
			return executeTransaction(tx);
		} else {
			return this.prisma.$transaction(executeTransaction);
		}
	}

	async spendPoints(dto: CreatePointTransactionDto): Promise<PointBalanceDto> {
		if (dto.amount <= 0) {
			throw new BadRequestException(ErrorCodes.POINT_INVALID_AMOUNT);
		}

		return await this.prisma.$transaction(async (tx) => {
			const currentBalance = await this.getOrCreateBalance(dto.userId, tx);

			if (currentBalance.availableBalance < dto.amount) {
				throw new BadRequestException(ErrorCodes.POINT_INSUFFICIENT_BALANCE);
			}

			const newTotalBalance = currentBalance.totalBalance - dto.amount;
			const newAvailableBalance = currentBalance.availableBalance - dto.amount;
			const newLifetimeSpent = currentBalance.lifetimeSpent + dto.amount;

			await tx.pointTransaction.create({
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

			const updatedBalance = await tx.userPointBalance.update({
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
			throw new BadRequestException(ErrorCodes.POINT_INVALID_AMOUNT);
		}

		return await this.prisma.$transaction(async (tx) => {
			const currentBalance = await this.getOrCreateBalance(userId, tx);

			if (currentBalance.availableBalance < amount) {
				throw new BadRequestException(ErrorCodes.POINT_INSUFFICIENT_BALANCE);
			}

			const newAvailableBalance = currentBalance.availableBalance - amount;
			const newLockedBalance = currentBalance.lockedBalance + amount;

			await tx.pointTransaction.create({
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

			return await tx.userPointBalance.update({
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
			throw new BadRequestException(ErrorCodes.POINT_INVALID_AMOUNT);
		}

		return await this.prisma.$transaction(async (tx) => {
			const currentBalance = await this.getOrCreateBalance(userId, tx);

			if (currentBalance.lockedBalance < amount) {
				throw new BadRequestException(ErrorCodes.POINT_INSUFFICIENT_LOCKED_BALANCE);
			}

			const newAvailableBalance = currentBalance.availableBalance + amount;
			const newLockedBalance = currentBalance.lockedBalance - amount;

			await tx.pointTransaction.create({
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

			return await tx.userPointBalance.update({
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
		const where: any = { userId };
		if (source) where.source = source;
		if (type) where.type = type;

		const [transactions, total] = await Promise.all([
			this.prisma.pointTransaction.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				take: limit,
				skip: (page - 1) * limit,
			}),
			this.prisma.pointTransaction.count({ where }),
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

		const now = new Date();
		const startOfDay = new Date(now.setHours(0, 0, 0, 0));
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const [todayEarned, todaySpent, monthEarned, monthSpent] = await Promise.all([
			this.prisma.pointTransaction.aggregate({
				where: {
					userId,
					type: PointTransactionType.EARNED,
					createdAt: { gte: startOfDay },
				},
				_sum: { amount: true },
			}),
			this.prisma.pointTransaction.aggregate({
				where: {
					userId,
					type: PointTransactionType.SPENT,
					createdAt: { gte: startOfDay },
				},
				_sum: { amount: true },
			}),
			this.prisma.pointTransaction.aggregate({
				where: {
					userId,
					type: PointTransactionType.EARNED,
					createdAt: { gte: startOfMonth },
				},
				_sum: { amount: true },
			}),
			this.prisma.pointTransaction.aggregate({
				where: {
					userId,
					type: PointTransactionType.SPENT,
					createdAt: { gte: startOfMonth },
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
				earned: monthEarned._sum.amount || 0,
				spent: Math.abs(monthSpent._sum.amount || 0),
			},
		};
	}

	async refundPoints(
		userId: string,
		originalTransactionId: string,
		reason: string,
	): Promise<PointBalanceDto> {
		const originalTransaction = await this.prisma.pointTransaction.findUnique({
			where: { id: originalTransactionId },
		});

		if (!originalTransaction) {
			throw new NotFoundException(ErrorCodes.POINT_TRANSACTION_NOT_FOUND);
		}

		if (originalTransaction.type !== PointTransactionType.SPENT) {
			throw new BadRequestException(ErrorCodes.POINT_REFUND_INVALID_TRANSACTION_TYPE);
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
			throw new BadRequestException(ErrorCodes.POINT_INVALID_AMOUNT);
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