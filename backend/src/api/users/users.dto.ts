import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

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
	@IsString()
	pfpNftId?: string;
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
