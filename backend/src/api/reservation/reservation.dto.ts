import { ApiProperty } from '@nestjs/swagger';
import {
	IsString,
	IsNumber,
	IsOptional,
	IsDateString,
	IsEnum,
	Min,
	Max,
} from 'class-validator';
import { ReservationStatus } from '@prisma/client';

export class CreateReservationDTO {
	@ApiProperty({ description: '매장 ID' })
	@IsString()
	spaceId!: string;

	@ApiProperty({ description: '예약 일시 (ISO 8601)' })
	@IsDateString()
	reservationTime!: string;

	@ApiProperty({ description: '인원 수', minimum: 1, maximum: 100 })
	@IsNumber()
	@Min(1)
	@Max(100)
	guestCount!: number;

	@ApiProperty({ description: '예약자 이름 (비회원 예약 시)', required: false })
	@IsOptional()
	@IsString()
	guestName?: string;

	@ApiProperty({ description: '연락처', required: false })
	@IsOptional()
	@IsString()
	contactNumber?: string;

	@ApiProperty({ description: '메모/요청사항', required: false })
	@IsOptional()
	@IsString()
	memo?: string;
}

export class GetReservationsQueryDTO {
	@ApiProperty({ required: false, enum: ReservationStatus })
	@IsOptional()
	@IsEnum(ReservationStatus)
	status?: ReservationStatus;

	@ApiProperty({ required: false, description: '시작일' })
	@IsOptional()
	@IsDateString()
	startDate?: string;

	@ApiProperty({ required: false, description: '종료일' })
	@IsOptional()
	@IsDateString()
	endDate?: string;

	@ApiProperty({ required: false, default: 1 })
	@IsOptional()
	@IsNumber()
	@Min(1)
	page?: number = 1;

	@ApiProperty({ required: false, default: 20 })
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(100)
	limit?: number = 20;
}

export class CancelReservationDTO {
	@ApiProperty({ description: '취소 사유', required: false })
	@IsOptional()
	@IsString()
	cancelReason?: string;
}

export class ReservationSpaceInfo {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;

	@ApiProperty({ required: false })
	nameEn?: string;

	@ApiProperty()
	address!: string;

	@ApiProperty({ required: false })
	imageUrl?: string;
}

export class ReservationUserInfo {
	@ApiProperty()
	id!: string;

	@ApiProperty({ required: false })
	nickName?: string;

	@ApiProperty({ required: false })
	profileImageUrl?: string;
}

export class ReservationResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	reservationTime!: Date;

	@ApiProperty()
	guestCount!: number;

	@ApiProperty({ enum: ReservationStatus })
	status!: ReservationStatus;

	@ApiProperty({ required: false })
	contactNumber?: string;

	@ApiProperty({ required: false })
	memo?: string;

	@ApiProperty({ required: false })
	ownerMemo?: string;

	@ApiProperty({ required: false })
	cancelReason?: string;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty({ type: ReservationSpaceInfo })
	space!: ReservationSpaceInfo;
}

export class ReservationListResponse {
	@ApiProperty({ type: [ReservationResponse] })
	reservations!: ReservationResponse[];

	@ApiProperty()
	pagination!: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
