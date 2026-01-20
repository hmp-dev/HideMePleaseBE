import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';

export class CreateApiKeyDTO {
	@ApiProperty({ description: 'API 키 이름', example: 'Partner Integration' })
	@IsNotEmpty()
	@IsString()
	name!: string;

	@ApiProperty({ description: '연결할 사용자 ID' })
	@IsNotEmpty()
	@IsUUID()
	userId!: string;

	@ApiPropertyOptional({
		description: '만료일 (null이면 무제한)',
		example: '2026-12-31T23:59:59.000Z',
	})
	@IsOptional()
	@IsDateString()
	expiresAt?: string;
}
