import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsString,
	IsOptional,
	IsNumber,
	IsEnum,
	Min,
	Max,
	IsBoolean,
	IsDateString,
	IsInt,
	IsObject,
} from 'class-validator';
import {
	BenefitLevel,
	DayOfWeek,
	ReservationStatus,
	SpaceCategory,
	StoreStatus,
} from '@prisma/client';

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

	@ApiPropertyOptional({ description: '사진 1 ID' })
	@IsOptional()
	@IsString()
	photo1Id?: string;

	@ApiPropertyOptional({ description: '사진 2 ID' })
	@IsOptional()
	@IsString()
	photo2Id?: string;

	@ApiPropertyOptional({ description: '사진 3 ID' })
	@IsOptional()
	@IsString()
	photo3Id?: string;

	@ApiPropertyOptional({ description: '사업자등록증 이미지 ID' })
	@IsOptional()
	@IsString()
	businessRegistrationImageId?: string;

	@ApiPropertyOptional({ description: '연락처 (휴대폰번호)' })
	@IsOptional()
	@IsString()
	phoneNumber?: string;
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

	@ApiPropertyOptional({ description: '사진 1 ID' })
	@IsOptional()
	@IsString()
	photo1Id?: string;

	@ApiPropertyOptional({ description: '사진 2 ID' })
	@IsOptional()
	@IsString()
	photo2Id?: string;

	@ApiPropertyOptional({ description: '사진 3 ID' })
	@IsOptional()
	@IsString()
	photo3Id?: string;

	@ApiPropertyOptional({ description: '사업자등록증 이미지 ID' })
	@IsOptional()
	@IsString()
	businessRegistrationImageId?: string;

	@ApiPropertyOptional({ description: '위도' })
	@IsOptional()
	@IsNumber()
	latitude?: number;

	@ApiPropertyOptional({ description: '경도' })
	@IsOptional()
	@IsNumber()
	longitude?: number;

	@ApiPropertyOptional({ description: '카테고리', enum: SpaceCategory })
	@IsOptional()
	@IsEnum(SpaceCategory)
	category?: SpaceCategory;

	@ApiPropertyOptional({ description: '대표 이미지 ID' })
	@IsOptional()
	@IsString()
	imageId?: string;

	@ApiPropertyOptional({ description: '임시 휴무 종료일' })
	@IsOptional()
	@IsString()
	temporaryClosureEndDate?: string;

	@ApiPropertyOptional({ description: '위치 설명' })
	@IsOptional()
	@IsString()
	locationDescription?: string;

	@ApiPropertyOptional({ description: '체크인 활성화' })
	@IsOptional()
	@IsBoolean()
	checkInEnabled?: boolean;

	@ApiPropertyOptional({ description: '체크인 포인트 오버라이드' })
	@IsOptional()
	@IsNumber()
	checkInPointsOverride?: number;

	@ApiPropertyOptional({ description: '체크인 요구사항' })
	@IsOptional()
	checkInRequirements?: any;

	@ApiPropertyOptional({ description: '일일 체크인 한도' })
	@IsOptional()
	@IsNumber()
	dailyCheckInLimit?: number;

	@ApiPropertyOptional({ description: '최대 체크인 수용량' })
	@IsOptional()
	@IsNumber()
	maxCheckInCapacity?: number;

	@ApiPropertyOptional({ description: '연락처 (휴대폰번호)' })
	@IsOptional()
	@IsString()
	phoneNumber?: string;
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

	@ApiPropertyOptional()
	photo1Url?: string;

	@ApiPropertyOptional()
	photo2Url?: string;

	@ApiPropertyOptional()
	photo3Url?: string;

	@ApiPropertyOptional()
	businessRegistrationImageUrl?: string;

	@ApiProperty()
	latitude!: number;

	@ApiProperty()
	longitude!: number;

	@ApiProperty({ required: false })
	addressEn?: string;

	@ApiProperty({ required: false })
	webLink?: string;

	@ApiProperty()
	businessHoursStart!: string;

	@ApiProperty()
	businessHoursEnd!: string;

	@ApiProperty({ required: false })
	introduction?: string;

	@ApiProperty({ required: false })
	introductionEn?: string;

	@ApiProperty({ required: false })
	locationDescription?: string;

	@ApiProperty()
	isTemporarilyClosed!: boolean;

	@ApiProperty({ required: false })
	temporaryClosureReason?: string;

	@ApiProperty({ required: false })
	temporaryClosureEndDate?: string;

	@ApiProperty()
	checkInEnabled!: boolean;

	@ApiProperty({ required: false })
	checkInPointsOverride?: number;

	@ApiProperty({ required: false })
	checkInRequirements?: any;

	@ApiProperty({ required: false })
	dailyCheckInLimit?: number;

	@ApiProperty({ required: false })
	maxCheckInCapacity?: number;

	@ApiProperty({ required: false })
	phoneNumber?: string;

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

export class CreateOwnerBenefitDTO {
	@ApiProperty({ description: '혜택 설명' })
	@IsString()
	description!: string;

	@ApiPropertyOptional({ description: '혜택 설명 (영문)' })
	@IsOptional()
	@IsString()
	descriptionEn?: string;

	@ApiPropertyOptional({ description: '요일', enum: DayOfWeek })
	@IsOptional()
	@IsEnum(DayOfWeek)
	dayOfWeek?: DayOfWeek;

	@ApiPropertyOptional({ description: '혜택 레벨', enum: BenefitLevel })
	@IsOptional()
	@IsEnum(BenefitLevel)
	level?: BenefitLevel;

	@ApiPropertyOptional({ description: '1회성 혜택 여부' })
	@IsOptional()
	@IsBoolean()
	singleUse?: boolean;

	@ApiPropertyOptional({ description: '대표 혜택 여부' })
	@IsOptional()
	@IsBoolean()
	isRepresentative?: boolean;
}

export class UpdateOwnerBenefitDTO {
	@ApiPropertyOptional({ description: '혜택 설명' })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({ description: '혜택 설명 (영문)' })
	@IsOptional()
	@IsString()
	descriptionEn?: string;

	@ApiPropertyOptional({ description: '요일', enum: DayOfWeek })
	@IsOptional()
	@IsEnum(DayOfWeek)
	dayOfWeek?: DayOfWeek;

	@ApiPropertyOptional({ description: '혜택 레벨', enum: BenefitLevel })
	@IsOptional()
	@IsEnum(BenefitLevel)
	level?: BenefitLevel;

	@ApiPropertyOptional({ description: '1회성 혜택 여부' })
	@IsOptional()
	@IsBoolean()
	singleUse?: boolean;

	@ApiPropertyOptional({ description: '대표 혜택 여부' })
	@IsOptional()
	@IsBoolean()
	isRepresentative?: boolean;

	@ApiPropertyOptional({ description: '활성 여부' })
	@IsOptional()
	@IsBoolean()
	active?: boolean;
}

export class GetOwnerBenefitsQueryDTO {
	@ApiPropertyOptional({ description: '요일 필터', enum: DayOfWeek })
	@IsOptional()
	@IsEnum(DayOfWeek)
	dayOfWeek?: DayOfWeek;
}
