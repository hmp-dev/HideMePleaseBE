import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Query,
	Request,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { PointSource, PointTransactionType } from '@/api/points/point.types';

import { AuthGuard } from '@/api/auth/auth.guard';
import { PointService } from '@/api/points/point.service';
import { AuthContext } from '@/types';

export class SpendPointsDto {
	amount!: number;
	description!: string;
	metadata?: any;
}

export class AdminGrantPointsDto {
	userId!: string;
	amount!: number;
	reason!: string;
}

export class RefundPointsDto {
	originalTransactionId!: string;
	reason!: string;
}

@ApiTags('points')
@Controller('points')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PointController {
	constructor(private readonly pointService: PointService) {}

	@Get('balance')
	@ApiOperation({ summary: '포인트 잔액 조회' })
	@ApiResponse({ status: 200, description: '포인트 잔액 정보' })
	async getBalance(@Request() req: Request) {
		const authContext = Reflect.get(req, 'authContext') as AuthContext;
		return await this.pointService.getOrCreateBalance(authContext.userId);
	}

	@Get('history')
	@ApiOperation({ summary: '포인트 거래 내역 조회' })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'limit', required: false, type: Number })
	@ApiQuery({ name: 'source', required: false, enum: PointSource })
	@ApiQuery({ name: 'type', required: false, enum: PointTransactionType })
	@ApiResponse({ status: 200, description: '포인트 거래 내역' })
	async getTransactionHistory(
		@Request() req: Request,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
		@Query('source') source?: PointSource,
		@Query('type') type?: PointTransactionType,
	) {
		const authContext = Reflect.get(req, 'authContext') as AuthContext;
		return await this.pointService.getTransactionHistory(
			authContext.userId,
			page || 1,
			limit || 20,
			source,
			type,
		);
	}

	@Get('summary')
	@ApiOperation({ summary: '포인트 요약 정보 조회' })
	@ApiResponse({ status: 200, description: '포인트 요약 정보' })
	async getPointSummary(@Request() req: Request) {
		const authContext = Reflect.get(req, 'authContext') as AuthContext;
		return await this.pointService.getPointSummary(authContext.userId);
	}

	@Post('spend')
	@ApiOperation({ summary: '포인트 사용' })
	@ApiResponse({ status: 200, description: '사용 후 포인트 잔액' })
	@ApiResponse({ status: 400, description: '포인트 부족 또는 잘못된 요청' })
	async spendPoints(
		@Request() req: Request,
		@Body() dto: SpendPointsDto,
	) {
		const authContext = Reflect.get(req, 'authContext') as AuthContext;
		return await this.pointService.spendPoints({
			userId: authContext.userId,
			amount: dto.amount,
			type: PointTransactionType.SPENT,
			source: PointSource.PURCHASE,
			description: dto.description,
			metadata: dto.metadata,
		});
	}

	@Post('refund')
	@ApiOperation({ summary: '포인트 환불' })
	@ApiResponse({ status: 200, description: '환불 후 포인트 잔액' })
	@ApiResponse({ status: 404, description: '원 거래를 찾을 수 없음' })
	async refundPoints(
		@Request() req: Request,
		@Body() dto: RefundPointsDto,
	) {
		const authContext = Reflect.get(req, 'authContext') as AuthContext;
		return await this.pointService.refundPoints(
			authContext.userId,
			dto.originalTransactionId,
			dto.reason,
		);
	}
}

@ApiTags('admin/points')
@Controller('admin/points')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AdminPointController {
	constructor(private readonly pointService: PointService) {}

	@Post('grant')
	@ApiOperation({ summary: '관리자 포인트 지급' })
	@ApiResponse({ status: 200, description: '지급 후 포인트 잔액' })
	async grantPoints(
		@Request() req: Request,
		@Body() dto: AdminGrantPointsDto,
	) {
		const authContext = Reflect.get(req, 'authContext') as AuthContext;
		
		if (dto.amount > 0) {
			return await this.pointService.earnPoints({
				userId: dto.userId,
				amount: dto.amount,
				type: PointTransactionType.EARNED,
				source: PointSource.ADMIN_GRANT,
				description: dto.reason,
				metadata: { adminId: authContext.userId },
			});
		} else {
			return await this.pointService.spendPoints({
				userId: dto.userId,
				amount: Math.abs(dto.amount),
				type: PointTransactionType.SPENT,
				source: PointSource.ADMIN_DEDUCT,
				description: dto.reason,
				metadata: { adminId: authContext.userId },
			});
		}
	}

	@Post('adjust/:userId')
	@ApiOperation({ summary: '관리자 포인트 조정' })
	@ApiResponse({ status: 200, description: '조정 후 포인트 잔액' })
	async adjustPoints(
		@Request() req: Request,
		@Param('userId') userId: string,
		@Body() dto: { amount: number; reason: string },
	) {
		const authContext = Reflect.get(req, 'authContext') as AuthContext;
		return await this.pointService.adjustPoints(
			userId,
			dto.amount,
			dto.reason,
			authContext.userId,
		);
	}

	@Get('user/:userId/balance')
	@ApiOperation({ summary: '특정 사용자 포인트 잔액 조회' })
	@ApiResponse({ status: 200, description: '포인트 잔액 정보' })
	async getUserBalance(@Param('userId') userId: string) {
		return await this.pointService.getOrCreateBalance(userId);
	}

	@Get('user/:userId/history')
	@ApiOperation({ summary: '특정 사용자 포인트 거래 내역 조회' })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'limit', required: false, type: Number })
	@ApiResponse({ status: 200, description: '포인트 거래 내역' })
	async getUserTransactionHistory(
		@Param('userId') userId: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
	) {
		return await this.pointService.getTransactionHistory(
			userId,
			page || 1,
			limit || 20,
		);
	}
}