import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from '@/api/auth/auth.guard';
import {
	CreateReservationDTO,
	GetReservationsQueryDTO,
	CancelReservationDTO,
} from '@/api/reservation/reservation.dto';
import { ReservationService } from '@/api/reservation/reservation.service';

@ApiTags('Reservation')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('reservation')
export class ReservationController {
	constructor(private reservationService: ReservationService) {}

	@ApiOperation({
		summary: '예약 생성',
		description: '매장에 예약을 생성합니다.',
	})
	@Post()
	async createReservation(
		@Body() createReservationDTO: CreateReservationDTO,
		@Req() request: Request,
	) {
		return this.reservationService.createReservation({
			createReservationDTO,
			request,
		});
	}

	@ApiOperation({
		summary: '내 예약 목록',
		description: '내 예약 목록을 조회합니다.',
	})
	@Get()
	async getMyReservations(
		@Query() query: GetReservationsQueryDTO,
		@Req() request: Request,
	) {
		return this.reservationService.getMyReservations({
			query,
			request,
		});
	}

	@ApiOperation({
		summary: '예약 상세 조회',
		description: '예약 상세 정보를 조회합니다.',
	})
	@ApiParam({ name: 'reservationId', description: '예약 ID' })
	@Get(':reservationId')
	async getReservation(
		@Param('reservationId') reservationId: string,
		@Req() request: Request,
	) {
		return this.reservationService.getReservation({
			reservationId,
			request,
		});
	}

	@ApiOperation({
		summary: '예약 취소',
		description: '예약을 취소합니다.',
	})
	@ApiParam({ name: 'reservationId', description: '예약 ID' })
	@Delete(':reservationId')
	async cancelReservation(
		@Param('reservationId') reservationId: string,
		@Body() cancelDTO: CancelReservationDTO,
		@Req() request: Request,
	) {
		return this.reservationService.cancelReservation({
			reservationId,
			cancelDTO,
			request,
		});
	}
}
