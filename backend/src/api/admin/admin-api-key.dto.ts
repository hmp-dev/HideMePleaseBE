import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsDateString,
	IsUUID,
	IsBoolean,
	ValidateIf,
} from 'class-validator';

export class CreateApiKeyDTO {
	@ApiProperty({ description: 'API 키 이름', example: 'Partner Integration' })
	@IsNotEmpty()
	@IsString()
	name!: string;

	@ApiPropertyOptional({
		description: '관리자 권한 여부 (true면 userId 불필요)',
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	isAdmin?: boolean;

	@ApiPropertyOptional({
		description: '연결할 사용자 ID (isAdmin이 false면 필수)',
	})
	@ValidateIf((o) => !o.isAdmin)
	@IsNotEmpty({ message: 'userId is required when isAdmin is false' })
	@IsUUID()
	userId?: string;

	@ApiPropertyOptional({
		description: '만료일 (null이면 무제한)',
		example: '2026-12-31T23:59:59.000Z',
	})
	@IsOptional()
	@IsDateString()
	expiresAt?: string;
}
