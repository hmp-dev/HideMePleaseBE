import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiSecurity,
	ApiTags,
} from '@nestjs/swagger';

import { AuthOrApiKeyGuard } from '@/api/auth/auth-or-api-key.guard';
import {
	CreateAgentReservationDTO,
	AgentReservationResponse,
} from '@/api/reservation/reservation.dto';
import { ReservationService } from '@/api/reservation/reservation.service';

@ApiTags('Reservations (AI Agent)')
@ApiBearerAuth()
@ApiSecurity('X-API-Key')
@UseGuards(AuthOrApiKeyGuard)
@Controller('reservations')
export class AgentReservationController {
	constructor(private reservationService: ReservationService) {}

	@ApiOperation({
		summary: 'AI 에이전트 예약 요청',
		description:
			'AI 에이전트가 예약을 요청합니다. 점주에게 푸시 알림이 발송되고, 5분 내에 결과가 callbackUrl로 전송됩니다.',
	})
	@ApiResponse({
		status: 201,
		description: '예약 요청 생성 성공',
		type: AgentReservationResponse,
	})
	@ApiResponse({
		status: 400,
		description: '잘못된 요청 (매장 없음, 과거 시간 등)',
	})
	@Post()
	async createAgentReservation(
		@Body() dto: CreateAgentReservationDTO,
	): Promise<AgentReservationResponse> {
		return this.reservationService.createAgentReservation(dto);
	}
}
