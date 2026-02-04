import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsString,
	IsOptional,
	IsNumber,
	IsEnum,
	Min,
	Max,
	IsBoolean,
	IsObject,
	IsArray,
	IsDateString,
} from 'class-validator';
import {
	BenefitLevel,
	DayOfWeek,
	ReservationStatus,
	RestroomGender,
	RestroomLocation,
	SpaceCategory,
	StoreStatus,
	VeganType,
} from '@prisma/client';

export class BusinessHourEntryDTO {
	@ApiProperty({ description: '휴무 여부' })
	@IsBoolean()
	isClosed!: boolean;

	@ApiProperty({ description: '오픈 시간' })
	@IsString()
	openTime!: string;

	@ApiProperty({ description: '마감 시간' })
	@IsString()
	closeTime!: string;

	@ApiPropertyOptional({ description: '브레이크 시작 시간' })
	@IsOptional()
	@IsString()
	breakStartTime?: string;

	@ApiPropertyOptional({ description: '브레이크 종료 시간' })
	@IsOptional()
	@IsString()
	breakEndTime?: string;
}

export class DayBenefitEntryDTO {
	@ApiProperty({ description: '혜택 이름/설명' })
	@IsString()
	name!: string;

	@ApiPropertyOptional({ description: '시작 시간' })
	@IsOptional()
	@IsString()
	startTime?: string;

	@ApiPropertyOptional({ description: '종료 시간' })
	@IsOptional()
	@IsString()
	endTime?: string;
}

export class RegisterOwnerDTO {
	@ApiPropertyOptional({ description: '점주 이름' })
	@IsOptional()
	@IsString()
	ownerName?: string;

	@ApiPropertyOptional({ description: '연락처 (휴대폰번호)' })
	@IsOptional()
	@IsString()
	phoneNumber?: string;

	@ApiPropertyOptional({ description: '이메일' })
	@IsOptional()
	@IsString()
	email?: string;

	@ApiPropertyOptional({ description: '약관 동의 여부' })
	@IsOptional()
	@IsBoolean()
	termsAccepted?: boolean;

	@ApiPropertyOptional({ description: '약관 동의 일시' })
	@IsOptional()
	@IsDateString()
	termsAcceptedAt?: string;

	@ApiPropertyOptional({ description: '마케팅 수신 동의 여부' })
	@IsOptional()
	@IsBoolean()
	marketingOptIn?: boolean;

	@ApiPropertyOptional({ description: '알림 설정 완료 여부' })
	@IsOptional()
	@IsBoolean()
	notificationSetupCompleted?: boolean;
}

export class CreateOwnerSpaceDTO {
	@ApiProperty({ description: '매장 이름' })
	@IsString()
	name!: string;

	@ApiProperty({ description: '매장 이름 (영문)', required: false })
	@IsOptional()
	@IsString()
	nameEn?: string;

	@ApiPropertyOptional({ description: '위도' })
	@IsOptional()
	@IsNumber()
	latitude?: number;

	@ApiPropertyOptional({ description: '경도' })
	@IsOptional()
	@IsNumber()
	longitude?: number;

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

	@ApiPropertyOptional({ description: '영업 시작 시간' })
	@IsOptional()
	@IsString()
	businessHoursStart?: string;

	@ApiPropertyOptional({ description: '영업 종료 시간' })
	@IsOptional()
	@IsString()
	businessHoursEnd?: string;

	@ApiPropertyOptional({
		description: '요일별 영업시간',
		example: {
			MONDAY: {
				isClosed: false,
				openTime: '09:00',
				closeTime: '20:00',
				breakStartTime: '',
				breakEndTime: '',
			},
		},
	})
	@IsOptional()
	@IsObject()
	businessHours?: Record<string, BusinessHourEntryDTO>;

	@ApiPropertyOptional({
		description: '요일별 혜택',
		example: {
			MONDAY: [
				{ name: '아메리카노 무제한 제공', startTime: '09:00', endTime: '20:00' },
			],
		},
	})
	@IsOptional()
	@IsObject()
	dayBenefits?: Record<string, DayBenefitEntryDTO[]>;

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

	@ApiPropertyOptional({ description: '이미지 ID' })
	@IsOptional()
	@IsString()
	imageId?: string;

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

	@ApiPropertyOptional({ description: '최대 체크인 수용량' })
	@IsOptional()
	@IsNumber()
	maxCheckInCapacity?: number;

	@ApiPropertyOptional({ description: '이벤트 활성화 여부' })
	@IsOptional()
	@IsBoolean()
	eventEnabled?: boolean;

	@ApiPropertyOptional({ description: '예약 활성화 여부' })
	@IsOptional()
	@IsBoolean()
	reservationEnabled?: boolean;

	@ApiPropertyOptional({ description: '주차 가능 여부' })
	@IsOptional()
	@IsBoolean()
	parkingAvailable?: boolean;

	@ApiPropertyOptional({ description: '발렛 가능 여부' })
	@IsOptional()
	@IsBoolean()
	valetAvailable?: boolean;

	@ApiPropertyOptional({ description: '단체석 가능 여부' })
	@IsOptional()
	@IsBoolean()
	groupSeatingAvailable?: boolean;

	@ApiPropertyOptional({ description: '유아 의자 여부' })
	@IsOptional()
	@IsBoolean()
	highChairAvailable?: boolean;

	@ApiPropertyOptional({ description: '콘센트 사용 가능 여부' })
	@IsOptional()
	@IsBoolean()
	outletAvailable?: boolean;

	@ApiPropertyOptional({ description: '휠체어 접근 가능 여부' })
	@IsOptional()
	@IsBoolean()
	wheelchairAccessible?: boolean;

	@ApiPropertyOptional({ description: '노키즈존 여부' })
	@IsOptional()
	@IsBoolean()
	noKidsZone?: boolean;

	@ApiPropertyOptional({ description: '반려동물 동반 가능 여부' })
	@IsOptional()
	@IsBoolean()
	petFriendly?: boolean;

	@ApiPropertyOptional({ description: '비건 옵션 타입', enum: VeganType })
	@IsOptional()
	@IsEnum(VeganType)
	veganType?: VeganType;

	@ApiPropertyOptional({ description: '비건 친화(레거시) 여부' })
	@IsOptional()
	@IsBoolean()
	veganFriendly?: boolean;

	@ApiPropertyOptional({ description: '와이파이 제공 여부' })
	@IsOptional()
	@IsBoolean()
	wifiAvailable?: boolean;

	@ApiPropertyOptional({ description: '와이파이 SSID' })
	@IsOptional()
	@IsString()
	wifiSsid?: string;

	@ApiPropertyOptional({ description: '화장실 위치', enum: RestroomLocation })
	@IsOptional()
	@IsEnum(RestroomLocation)
	restroomLocation?: RestroomLocation;

	@ApiPropertyOptional({ description: '화장실 구분', enum: RestroomGender })
	@IsOptional()
	@IsEnum(RestroomGender)
	restroomGender?: RestroomGender;

	@ApiPropertyOptional({ description: '흡연 공간 여부' })
	@IsOptional()
	@IsBoolean()
	smokingArea?: boolean;

	@ApiPropertyOptional({ description: '결제 수단 목록' })
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	paymentMethods?: string[];

	@ApiPropertyOptional({ description: '예약 보증금 필요 여부' })
	@IsOptional()
	@IsBoolean()
	reservationDepositRequired?: boolean;

	@ApiPropertyOptional({ description: '대기열 가능 여부' })
	@IsOptional()
	@IsBoolean()
	waitlistAvailable?: boolean;

	@ApiPropertyOptional({ description: '최대 예약 인원' })
	@IsOptional()
	@IsNumber()
	maxReservationPartySize?: number;

	@ApiPropertyOptional({ description: '품절 메뉴 ID 목록' })
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	soldOutMenuIds?: string[];

	@ApiPropertyOptional({ description: '테라스 좌석 여부' })
	@IsOptional()
	@IsBoolean()
	terraceSeating?: boolean;

	@ApiPropertyOptional({ description: '라스트 오더 시간' })
	@IsOptional()
	@IsString()
	lastOrderTime?: string;

	@ApiPropertyOptional({ description: '테이크아웃 가능 여부' })
	@IsOptional()
	@IsBoolean()
	takeoutAvailable?: boolean;

	@ApiPropertyOptional({ description: '유모차 보관 가능 여부' })
	@IsOptional()
	@IsBoolean()
	strollerStorage?: boolean;

	@ApiPropertyOptional({ description: '사진 배열 (업로드된 이미지 ID 목록)' })
	@IsOptional()
	@IsArray()
	photos?: any[];

	@ApiPropertyOptional({ description: '대표 사진 인덱스' })
	@IsOptional()
	@IsNumber()
	mainPhotoIndex?: number;

	@ApiPropertyOptional({ description: '사업자등록증 정보' })
	@IsOptional()
	businessLicense?: any;
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

	@ApiPropertyOptional({ description: '이벤트 활성화 여부' })
	@IsOptional()
	@IsBoolean()
	eventEnabled?: boolean;

	@ApiPropertyOptional({ description: '예약 활성화 여부' })
	@IsOptional()
	@IsBoolean()
	reservationEnabled?: boolean;

	@ApiPropertyOptional({ description: '주차 가능 여부' })
	@IsOptional()
	@IsBoolean()
	parkingAvailable?: boolean;

	@ApiPropertyOptional({ description: '발렛 가능 여부' })
	@IsOptional()
	@IsBoolean()
	valetAvailable?: boolean;

	@ApiPropertyOptional({ description: '단체석 가능 여부' })
	@IsOptional()
	@IsBoolean()
	groupSeatingAvailable?: boolean;

	@ApiPropertyOptional({ description: '유아 의자 여부' })
	@IsOptional()
	@IsBoolean()
	highChairAvailable?: boolean;

	@ApiPropertyOptional({ description: '콘센트 사용 가능 여부' })
	@IsOptional()
	@IsBoolean()
	outletAvailable?: boolean;

	@ApiPropertyOptional({ description: '휠체어 접근 가능 여부' })
	@IsOptional()
	@IsBoolean()
	wheelchairAccessible?: boolean;

	@ApiPropertyOptional({ description: '노키즈존 여부' })
	@IsOptional()
	@IsBoolean()
	noKidsZone?: boolean;

	@ApiPropertyOptional({ description: '반려동물 동반 가능 여부' })
	@IsOptional()
	@IsBoolean()
	petFriendly?: boolean;

	@ApiPropertyOptional({ description: '비건 옵션 타입', enum: VeganType })
	@IsOptional()
	@IsEnum(VeganType)
	veganType?: VeganType;

	@ApiPropertyOptional({ description: '비건 친화(레거시) 여부' })
	@IsOptional()
	@IsBoolean()
	veganFriendly?: boolean;

	@ApiPropertyOptional({ description: '와이파이 제공 여부' })
	@IsOptional()
	@IsBoolean()
	wifiAvailable?: boolean;

	@ApiPropertyOptional({ description: '와이파이 SSID' })
	@IsOptional()
	@IsString()
	wifiSsid?: string;

	@ApiPropertyOptional({ description: '화장실 위치', enum: RestroomLocation })
	@IsOptional()
	@IsEnum(RestroomLocation)
	restroomLocation?: RestroomLocation;

	@ApiPropertyOptional({ description: '화장실 구분', enum: RestroomGender })
	@IsOptional()
	@IsEnum(RestroomGender)
	restroomGender?: RestroomGender;

	@ApiPropertyOptional({ description: '흡연 공간 여부' })
	@IsOptional()
	@IsBoolean()
	smokingArea?: boolean;

	@ApiPropertyOptional({ description: '결제 수단 목록' })
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	paymentMethods?: string[];

	@ApiPropertyOptional({ description: '예약 보증금 필요 여부' })
	@IsOptional()
	@IsBoolean()
	reservationDepositRequired?: boolean;

	@ApiPropertyOptional({ description: '대기열 가능 여부' })
	@IsOptional()
	@IsBoolean()
	waitlistAvailable?: boolean;

	@ApiPropertyOptional({ description: '최대 예약 인원' })
	@IsOptional()
	@IsNumber()
	maxReservationPartySize?: number;

	@ApiPropertyOptional({ description: '품절 메뉴 ID 목록' })
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	soldOutMenuIds?: string[];

	@ApiPropertyOptional({ description: '테라스 좌석 여부' })
	@IsOptional()
	@IsBoolean()
	terraceSeating?: boolean;

	@ApiPropertyOptional({ description: '라스트 오더 시간' })
	@IsOptional()
	@IsString()
	lastOrderTime?: string;

	@ApiPropertyOptional({ description: '테이크아웃 가능 여부' })
	@IsOptional()
	@IsBoolean()
	takeoutAvailable?: boolean;

	@ApiPropertyOptional({ description: '유모차 보관 가능 여부' })
	@IsOptional()
	@IsBoolean()
	strollerStorage?: boolean;
}

export class OwnerSpaceStatusDTO {
	@ApiPropertyOptional({ description: '임시 휴무 여부' })
	@IsOptional()
	@IsBoolean()
	isTemporarilyClosed?: boolean;

	@ApiPropertyOptional({ description: '임시 휴무 사유' })
	@IsOptional()
	@IsString()
	temporaryClosureReason?: string;

	@ApiPropertyOptional({ description: '임시 휴무 종료일' })
	@IsOptional()
	@IsString()
	temporaryClosureEndDate?: string;

	@ApiPropertyOptional({ description: '이벤트 활성화 여부' })
	@IsOptional()
	@IsBoolean()
	eventEnabled?: boolean;

	@ApiPropertyOptional({ description: '예약 활성화 여부' })
	@IsOptional()
	@IsBoolean()
	reservationEnabled?: boolean;
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

// 통합 예약 상태 변경 DTO
export class UnifiedUpdateReservationDTO {
	@ApiProperty({
		description: '변경할 예약 상태',
		enum: ['confirmed', 'cancelled', 'completed', 'no_show'],
	})
	@IsString()
	status!: 'confirmed' | 'cancelled' | 'completed' | 'no_show';

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
	guestName?: string;

	@ApiProperty({ required: false })
	memo?: string;

	@ApiProperty({ required: false })
	ownerMemo?: string;

	@ApiProperty({ required: false, description: 'AI 에이전트 이름 (에이전트 예약인 경우)' })
	agentName?: string;

	@ApiProperty({ required: false, description: '응답 만료 시간 (에이전트 예약인 경우)' })
	expiresAt?: Date;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty({ required: false })
	confirmedAt?: Date;

	@ApiProperty({ required: false })
	cancelledAt?: Date;

	@ApiProperty({ required: false })
	cancelReason?: string;

	@ApiProperty()
	user!: {
		id: string;
		nickName?: string;
		profileImageUrl?: string;
	} | null;
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
