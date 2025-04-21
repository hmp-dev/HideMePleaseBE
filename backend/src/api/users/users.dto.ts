import { ApiProperty } from '@nestjs/swagger';
import {
	IsArray,
	IsBoolean,
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
