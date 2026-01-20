import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';

import { AuthOrApiKeyGuard } from '@/api/auth/auth-or-api-key.guard';
import { OwnerGuard } from '@/api/owner/owner.guard';
import {
	CreateOwnerSpaceDTO,
	UpdateOwnerSpaceDTO,
	GetOwnerReservationsQueryDTO,
	UpdateReservationStatusDTO,
	RegisterOwnerFcmTokenDTO,
} from '@/api/owner/owner.dto';
import { OwnerService } from '@/api/owner/owner.service';

@ApiTags('Owner')
@ApiBearerAuth()
@UseGuards(AuthOrApiKeyGuard, OwnerGuard)
@Controller('owner')
export class OwnerController {
	constructor(private ownerService: OwnerService) {}

	@ApiOperation({
		summary: '점주 대시보드',
		description: '점주 대시보드 통계를 조회합니다.',
	})
	@Get('dashboard')
	async getDashboard(@Req() request: Request) {
		return this.ownerService.getDashboard({ request });
	}

	@ApiOperation({
		summary: '내 매장 목록',
		description: '점주가 소유한 매장 목록을 조회합니다.',
	})
	@Get('spaces')
	async getMySpaces(@Req() request: Request) {
		return this.ownerService.getMySpaces({ request });
	}

	@ApiOperation({
		summary: '매장 등록',
		description: '새로운 매장을 등록합니다. (임시저장 상태)',
	})
	@Post('spaces')
	async createSpace(
		@Body() createSpaceDTO: CreateOwnerSpaceDTO,
		@Req() request: Request,
	) {
		return this.ownerService.createSpace({
			createSpaceDTO,
			request,
		});
	}

	@ApiOperation({
		summary: '매장 정보 수정',
		description: '매장 정보를 수정합니다.',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@Patch('spaces/:spaceId')
	async updateSpace(
		@Param('spaceId') spaceId: string,
		@Body() updateSpaceDTO: UpdateOwnerSpaceDTO,
		@Req() request: Request,
	) {
		return this.ownerService.updateSpace({
			spaceId,
			updateSpaceDTO,
			request,
		});
	}

	@ApiOperation({
		summary: '매장 승인 요청',
		description: '매장 노출 승인을 요청합니다. (DRAFT/REJECTED → PENDING)',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@Post('spaces/:spaceId/submit')
	async submitForApproval(
		@Param('spaceId') spaceId: string,
		@Req() request: Request,
	) {
		return this.ownerService.submitForApproval({
			spaceId,
			request,
		});
	}

	@ApiOperation({
		summary: '매장 예약 목록',
		description: '매장의 예약 목록을 조회합니다.',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@Get('spaces/:spaceId/reservations')
	async getSpaceReservations(
		@Param('spaceId') spaceId: string,
		@Query() query: GetOwnerReservationsQueryDTO,
		@Req() request: Request,
	) {
		return this.ownerService.getSpaceReservations({
			spaceId,
			query,
			request,
		});
	}

	@ApiOperation({
		summary: '예약 확정',
		description: '예약을 확정합니다.',
	})
	@ApiParam({ name: 'reservationId', description: '예약 ID' })
	@Patch('reservations/:reservationId/confirm')
	async confirmReservation(
		@Param('reservationId') reservationId: string,
		@Body() updateDTO: UpdateReservationStatusDTO,
		@Req() request: Request,
	) {
		return this.ownerService.confirmReservation({
			reservationId,
			updateDTO,
			request,
		});
	}

	@ApiOperation({
		summary: '예약 취소 (점주)',
		description: '점주가 예약을 취소합니다.',
	})
	@ApiParam({ name: 'reservationId', description: '예약 ID' })
	@Patch('reservations/:reservationId/cancel')
	async cancelReservation(
		@Param('reservationId') reservationId: string,
		@Body() updateDTO: UpdateReservationStatusDTO,
		@Req() request: Request,
	) {
		return this.ownerService.cancelReservationByOwner({
			reservationId,
			updateDTO,
			request,
		});
	}

	@ApiOperation({
		summary: '예약 완료',
		description: '예약을 완료 처리합니다.',
	})
	@ApiParam({ name: 'reservationId', description: '예약 ID' })
	@Patch('reservations/:reservationId/complete')
	async completeReservation(
		@Param('reservationId') reservationId: string,
		@Body() updateDTO: UpdateReservationStatusDTO,
		@Req() request: Request,
	) {
		return this.ownerService.completeReservation({
			reservationId,
			updateDTO,
			request,
		});
	}

	@ApiOperation({
		summary: '노쇼 처리',
		description: '예약을 노쇼 처리합니다.',
	})
	@ApiParam({ name: 'reservationId', description: '예약 ID' })
	@Patch('reservations/:reservationId/no-show')
	async noShowReservation(
		@Param('reservationId') reservationId: string,
		@Body() updateDTO: UpdateReservationStatusDTO,
		@Req() request: Request,
	) {
		return this.ownerService.noShowReservation({
			reservationId,
			updateDTO,
			request,
		});
	}

	@ApiOperation({
		summary: '점주 앱 FCM 토큰 등록',
		description: '점주 앱의 FCM 푸시 토큰을 등록합니다.',
	})
	@ApiResponse({
		status: 200,
		description: '토큰 등록 성공',
	})
	@Post('fcm-token')
	async registerOwnerFcmToken(
		@Req() request: Request,
		@Body() dto: RegisterOwnerFcmTokenDTO,
	) {
		return this.ownerService.registerOwnerFcmToken({
			request,
			fcmToken: dto.fcmToken,
		});
	}

	@ApiOperation({
		summary: '점주 앱 FCM 토큰 삭제',
		description: '점주 앱의 FCM 푸시 토큰을 삭제합니다.',
	})
	@ApiResponse({
		status: 200,
		description: '토큰 삭제 성공',
	})
	@Delete('fcm-token')
	async removeOwnerFcmToken(@Req() request: Request) {
		return this.ownerService.removeOwnerFcmToken({ request });
	}
}
