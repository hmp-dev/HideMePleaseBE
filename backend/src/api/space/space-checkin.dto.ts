import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CheckInDTO {
	@ApiProperty()
	@IsNumber()
	latitude!: number;

	@ApiProperty()
	@IsNumber()
	longitude!: number;

	@ApiProperty({
		description: '사용할 혜택 ID',
		required: false,
	})
	@IsOptional()
	@IsString()
	benefitId?: string;

	@ApiProperty({
		description: 'FCM 토큰 (Silent Push용)',
		required: false,
	})
	@IsOptional()
	@IsString()
	fcmToken?: string;
}

export class HeartbeatDTO {
	@ApiProperty({
		description: '체크인한 공간 ID',
	})
	@IsString()
	spaceId!: string;

	@ApiProperty({
		description: '현재 위치 위도',
	})
	@IsNumber()
	latitude!: number;

	@ApiProperty({
		description: '현재 위치 경도',
	})
	@IsNumber()
	longitude!: number;

	@ApiProperty({
		description: '타임스탬프',
		required: false,
	})
	@IsOptional()
	@IsDateString()
	timestamp?: string;

	@ApiProperty({
		description: '사용 중인 혜택 ID',
		required: false,
	})
	@IsOptional()
	@IsString()
	benefitId?: string;
}

export class CheckOutDTO {
	@ApiProperty()
	@IsNumber()
	latitude!: number;

	@ApiProperty()
	@IsNumber()
	longitude!: number;
}

export class CheckInStatusResponse {
	@ApiProperty()
	isCheckedIn!: boolean;

	@ApiProperty({ required: false })
	checkedInAt?: Date;

	@ApiProperty({ required: false })
	groupProgress?: string;

	@ApiProperty({ required: false })
	earnedPoints?: number;

	@ApiProperty({ required: false })
	groupId?: string;
}

export class CheckInUserInfo {
	@ApiProperty()
	userId!: string;

	@ApiProperty({ required: false })
	nickName?: string;

	@ApiProperty({ required: false })
	profileImageUrl?: string;

	@ApiProperty()
	checkedInAt!: Date;
}

export class CurrentGroupResponse {
	@ApiProperty()
	groupId!: string;

	@ApiProperty()
	progress!: string;

	@ApiProperty()
	isCompleted!: boolean;

	@ApiProperty({ type: [CheckInUserInfo] })
	members!: CheckInUserInfo[];

	@ApiProperty()
	bonusPoints!: number;
}

export class CheckInUsersResponse {
	@ApiProperty()
	totalCount!: number;

	@ApiProperty({ type: [CheckInUserInfo] })
	users!: CheckInUserInfo[];

	@ApiProperty({ required: false })
	currentGroup?: CurrentGroupResponse;
}

export class CheckOutAllUsersResponse {
	@ApiProperty()
	success!: boolean;

	@ApiProperty()
	checkedOutCount!: number;

	@ApiProperty()
	spaceName!: string;
}

export class HeartbeatResponse {
	@ApiProperty({
		description: '성공 여부',
	})
	success!: boolean;

	@ApiProperty({
		description: '체크인 상태 (active, expired, invalid)',
		enum: ['active', 'expired', 'invalid'],
	})
	checkinStatus!: 'active' | 'expired' | 'invalid';

	@ApiProperty({
		description: '마지막 활동 시간',
	})
	lastActivityTime!: Date;
}

export class CheckInStatusDTO {
	@ApiProperty({
		description: '활성 체크인 여부',
	})
	hasActiveCheckin!: boolean;

	@ApiProperty({
		description: '체크인 정보',
		required: false,
	})
	checkin?: {
		spaceId: string;
		spaceName: string;
		checkinTime: Date;
		lastActivityTime: Date;
		latitude: number;
		longitude: number;
		benefitId?: string;
		benefitDescription?: string;
	};
}