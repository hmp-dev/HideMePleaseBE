import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
