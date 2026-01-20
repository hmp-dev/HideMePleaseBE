import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateApiKeyDTO {
	@ApiProperty({ description: 'API 키 이름', example: 'Partner Integration' })
	@IsNotEmpty()
	@IsString()
	name!: string;

	@ApiPropertyOptional({
		description: '만료일 (null이면 무제한)',
		example: '2025-12-31T23:59:59.000Z',
	})
	@IsOptional()
	@IsDateString()
	expiresAt?: string;
}
