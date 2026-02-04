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
	SetMetadata,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiSecurity,
	ApiTags,
} from '@nestjs/swagger';

import { AuthOrApiKeyGuard } from '@/api/auth/auth-or-api-key.guard';
import { OwnerGuard } from '@/api/owner/owner.guard';
import {
	CreateOwnerSpaceDTO,
	UpdateOwnerSpaceDTO,
	GetOwnerReservationsQueryDTO,
	UpdateReservationStatusDTO,
	UnifiedUpdateReservationDTO,
	RegisterOwnerFcmTokenDTO,
	CreateOwnerBenefitDTO,
	UpdateOwnerBenefitDTO,
	GetOwnerBenefitsQueryDTO,
	OwnerSpaceStatusDTO,
} from '@/api/owner/owner.dto';
import { OwnerService } from '@/api/owner/owner.service';

@ApiTags('Owner')
@ApiBearerAuth()
@ApiSecurity('X-API-Key')
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
		summary: '매장 상태 조회',
		description: '운영 상태(휴무/이벤트/예약)를 조회합니다.',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@Get('spaces/:spaceId/status')
	async getSpaceStatus(
		@Param('spaceId') spaceId: string,
		@Req() request: Request,
	) {
		return this.ownerService.getSpaceStatus({ spaceId, request });
	}

	@ApiOperation({
		summary: '매장 단건 조회',
		description: '점주가 소유한 매장의 상세 정보를 조회합니다.',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@Get('spaces/:spaceId')
	async getSpace(@Param('spaceId') spaceId: string, @Req() request: Request) {
		return this.ownerService.getSpace({ spaceId, request });
	}

	@ApiOperation({
		summary: '매장 등록',
		description: '새로운 매장을 등록합니다. (임시저장 상태)',
	})
	@SetMetadata('AUTO_PROMOTE_OWNER', true)
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
		summary: '매장 상태 업데이트',
		description: '운영 상태(휴무/이벤트/예약)를 업데이트합니다.',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@Patch('spaces/:spaceId/status')
	async updateSpaceStatus(
		@Param('spaceId') spaceId: string,
		@Body() statusDTO: OwnerSpaceStatusDTO,
		@Req() request: Request,
	) {
		return this.ownerService.updateSpaceStatus({
			spaceId,
			statusDTO,
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
		summary: '예약 상태 변경 (통합)',
		description:
			'예약 상태를 변경합니다. status 값: confirmed(승인), cancelled(거절), completed(완료), no_show(노쇼)',
	})
	@ApiParam({ name: 'reservationId', description: '예약 ID' })
	@ApiResponse({ status: 200, description: '상태 변경 성공' })
	@ApiResponse({ status: 400, description: '잘못된 요청 (이미 만료됨 등)' })
	@Patch('reservations/:reservationId')
	async updateReservationStatus(
		@Param('reservationId') reservationId: string,
		@Body() updateDTO: UnifiedUpdateReservationDTO,
		@Req() request: Request,
	) {
		return this.ownerService.updateReservationStatus({
			reservationId,
			updateDTO,
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

	// ── Image Upload ──

	@ApiOperation({
		summary: '이미지 업로드',
		description:
			'매장 사진 또는 사업자등록증 이미지를 업로드합니다. 반환된 id를 매장 등록/수정 시 photo1Id 등에 사용합니다.',
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	@ApiResponse({
		status: 201,
		description: '업로드 성공. { id: string, url: string }',
	})
	@SetMetadata('AUTO_PROMOTE_OWNER', true)
	@UseInterceptors(FileInterceptor('file'))
	@Post('upload-image')
	async uploadImage(
		@Req() request: Request,
		@UploadedFile() file: Express.Multer.File,
	) {
		return this.ownerService.uploadImage({ file, request });
	}

	// ── Benefit CRUD ──

	@ApiOperation({
		summary: '혜택 생성',
		description: '매장에 새로운 혜택을 생성합니다.',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@Post('spaces/:spaceId/benefits')
	async createBenefit(
		@Param('spaceId') spaceId: string,
		@Body() dto: CreateOwnerBenefitDTO,
		@Req() request: Request,
	) {
		return this.ownerService.createBenefit({ spaceId, dto, request });
	}

	@ApiOperation({
		summary: '혜택 목록 조회',
		description: '매장의 혜택 목록을 조회합니다. dayOfWeek 필터를 지원합니다.',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@Get('spaces/:spaceId/benefits')
	async getBenefits(
		@Param('spaceId') spaceId: string,
		@Query() query: GetOwnerBenefitsQueryDTO,
		@Req() request: Request,
	) {
		return this.ownerService.getBenefits({ spaceId, query, request });
	}

	@ApiOperation({
		summary: '혜택 수정',
		description: '매장의 혜택을 수정합니다.',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@ApiParam({ name: 'benefitId', description: '혜택 ID' })
	@Patch('spaces/:spaceId/benefits/:benefitId')
	async updateBenefit(
		@Param('spaceId') spaceId: string,
		@Param('benefitId') benefitId: string,
		@Body() dto: UpdateOwnerBenefitDTO,
		@Req() request: Request,
	) {
		return this.ownerService.updateBenefit({
			spaceId,
			benefitId,
			dto,
			request,
		});
	}

	@ApiOperation({
		summary: '혜택 삭제',
		description: '매장의 혜택을 삭제합니다.',
	})
	@ApiParam({ name: 'spaceId', description: '매장 ID' })
	@ApiParam({ name: 'benefitId', description: '혜택 ID' })
	@Delete('spaces/:spaceId/benefits/:benefitId')
	async deleteBenefit(
		@Param('spaceId') spaceId: string,
		@Param('benefitId') benefitId: string,
		@Req() request: Request,
	) {
		return this.ownerService.deleteBenefit({
			spaceId,
			benefitId,
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
