import { ApiProperty } from '@nestjs/swagger';
import {
	IsArray,
	IsBoolean,
	IsDateString,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';

export class UpdateUserProfileDTO {
	@ApiProperty()
	@IsOptional()
	@IsString()
	nickName?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	introduction?: string;

	@ApiProperty()
	@IsOptional()
	@IsBoolean()
	locationPublic?: boolean;

	@ApiProperty()
	@IsOptional()
	@IsBoolean()
	notificationsEnabled?: boolean;

	@ApiProperty()
	@IsOptional()
	@IsString()
	pfpNftId?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	fcmToken?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	profilePartsString?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	finalProfileImageUrl?: string;

	@ApiProperty({ description: '온보딩 완료 여부' })
	@IsOptional()
	@IsBoolean()
	onboardingCompleted?: boolean;

	@ApiProperty({ description: '앱 OS (ios, android 등)' })
	@IsOptional()
	@IsString()
	appOS?: string;

	@ApiProperty({ description: '앱 버전 (예: 2.5.0)' })
	@IsOptional()
	@IsString()
	appVersion?: string;

	@ApiProperty({ description: '휴대폰 번호' })
	@IsOptional()
	@IsString()
	phoneNumber?: string;

	@ApiProperty({ description: '점주 실명' })
	@IsOptional()
	@IsString()
	ownerName?: string;

	@ApiProperty({ description: '약관 동의 여부' })
	@IsOptional()
	@IsBoolean()
	termsAccepted?: boolean;

	@ApiProperty({ description: '약관 동의 시각 (ISO 8601)' })
	@IsOptional()
	@IsDateString()
	termsAcceptedAt?: string;

	@ApiProperty({ description: '마케팅 수신 동의 여부' })
	@IsOptional()
	@IsBoolean()
	marketingOptIn?: boolean;

	@ApiProperty({ description: '알림 설정 완료 여부' })
	@IsOptional()
	@IsBoolean()
	notificationSetupCompleted?: boolean;
}

export class UpdateLastKnownLocationDTO {
	@ApiProperty()
	@IsNumber()
	latitude!: number;

	@ApiProperty()
	@IsNumber()
	longitude!: number;

	@ApiProperty()
	@IsOptional()
	@IsString()
	spaceId?: string;
}

export class SelectNftDTO {
	@ApiProperty()
	@IsString()
	nftId!: string;

	@ApiProperty()
	@IsBoolean()
	selected!: boolean;

	@ApiProperty()
	@IsNumber()
	order!: number;
}

export class SelectedNftOrderDTO {
	@ApiProperty()
	@IsArray()
	order!: string[];
}
