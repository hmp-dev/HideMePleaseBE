import { ApiProperty } from '@nestjs/swagger';
import {
	IsString,
	IsOptional,
	IsNumber,
	IsEnum,
	Min,
	Max,
	IsBoolean,
} from 'class-validator';
import { ReservationStatus, SpaceCategory, StoreStatus } from '@prisma/client';

export class CreateOwnerSpaceDTO {
	@ApiProperty({ description: '매장 이름' })
	@IsString()
	name!: string;

	@ApiProperty({ description: '매장 이름 (영문)', required: false })
	@IsOptional()
	@IsString()
	nameEn?: string;

	@ApiProperty({ description: '위도' })
	@IsNumber()
	latitude!: number;

	@ApiProperty({ description: '경도' })
	@IsNumber()
	longitude!: number;

	@ApiProperty({ description: '주소' })
	@IsString()
	address!: string;

	@ApiProperty({ description: '주소 (영문)', required: false })
	@IsOptional()
	@IsString()
	addressEn?: string;

	@ApiProperty({ description: '웹사이트 링크', required: false })
	@IsOptional()
	@IsString()
	webLink?: string;

	@ApiProperty({ description: '영업 시작 시간' })
	@IsString()
	businessHoursStart!: string;

	@ApiProperty({ description: '영업 종료 시간' })
	@IsString()
	businessHoursEnd!: string;

	@ApiProperty({ description: '카테고리', enum: SpaceCategory })
	@IsEnum(SpaceCategory)
	category!: SpaceCategory;

	@ApiProperty({ description: '소개', required: false })
	@IsOptional()
	@IsString()
	introduction?: string;

	@ApiProperty({ description: '소개 (영문)', required: false })
	@IsOptional()
	@IsString()
	introductionEn?: string;

	@ApiProperty({ description: '이미지 ID' })
	@IsString()
	imageId!: string;
}

export class UpdateOwnerSpaceDTO {
	@ApiProperty({ description: '매장 이름', required: false })
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty({ description: '매장 이름 (영문)', required: false })
	@IsOptional()
	@IsString()
	nameEn?: string;

	@ApiProperty({ description: '주소', required: false })
	@IsOptional()
	@IsString()
	address?: string;

	@ApiProperty({ description: '주소 (영문)', required: false })
	@IsOptional()
	@IsString()
	addressEn?: string;

	@ApiProperty({ description: '웹사이트 링크', required: false })
	@IsOptional()
	@IsString()
	webLink?: string;

	@ApiProperty({ description: '영업 시작 시간', required: false })
	@IsOptional()
	@IsString()
	businessHoursStart?: string;

	@ApiProperty({ description: '영업 종료 시간', required: false })
	@IsOptional()
	@IsString()
	businessHoursEnd?: string;

	@ApiProperty({ description: '소개', required: false })
	@IsOptional()
	@IsString()
	introduction?: string;

	@ApiProperty({ description: '소개 (영문)', required: false })
	@IsOptional()
	@IsString()
	introductionEn?: string;

	@ApiProperty({ description: '임시 휴무 여부', required: false })
	@IsOptional()
	@IsBoolean()
	isTemporarilyClosed?: boolean;

	@ApiProperty({ description: '임시 휴무 사유', required: false })
	@IsOptional()
	@IsString()
	temporaryClosureReason?: string;
}

export class SubmitSpaceForApprovalDTO {
	@ApiProperty({ description: '매장 ID' })
	@IsString()
	spaceId!: string;
}

export class GetOwnerReservationsQueryDTO {
	@ApiProperty({ required: false, enum: ReservationStatus })
	@IsOptional()
	@IsEnum(ReservationStatus)
	status?: ReservationStatus;

	@ApiProperty({ required: false, description: '시작일' })
	@IsOptional()
	@IsString()
	startDate?: string;

	@ApiProperty({ required: false, description: '종료일' })
	@IsOptional()
	@IsString()
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

export class UpdateReservationStatusDTO {
	@ApiProperty({ description: '점주 메모', required: false })
	@IsOptional()
	@IsString()
	ownerMemo?: string;

	@ApiProperty({ description: '취소 사유 (취소 시)', required: false })
	@IsOptional()
	@IsString()
	cancelReason?: string;
}

export class OwnerSpaceResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;

	@ApiProperty({ required: false })
	nameEn?: string;

	@ApiProperty()
	address!: string;

	@ApiProperty({ enum: SpaceCategory })
	category!: SpaceCategory;

	@ApiProperty({ enum: StoreStatus })
	storeStatus!: StoreStatus;

	@ApiProperty({ required: false })
	imageUrl?: string;

	@ApiProperty()
	createdAt!: Date;
}

export class OwnerReservationResponse {
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

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty()
	user!: {
		id: string;
		nickName?: string;
		profileImageUrl?: string;
	};
}

export class OwnerDashboardResponse {
	@ApiProperty({ description: '오늘 예약 수' })
	todayReservations!: number;

	@ApiProperty({ description: '대기 중 예약 수' })
	pendingReservations!: number;

	@ApiProperty({ description: '이번 주 예약 수' })
	weeklyReservations!: number;

	@ApiProperty({ description: '총 매장 수' })
	totalSpaces!: number;

	@ApiProperty({ description: '승인된 매장 수' })
	approvedSpaces!: number;
}

export class RegisterOwnerFcmTokenDTO {
	@ApiProperty({ description: '점주 앱 FCM 토큰' })
	@IsString()
	fcmToken!: string;
}
