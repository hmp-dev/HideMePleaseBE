import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class RedeemBenefitsDTO {
	@ApiProperty()
	@IsNumber()
	latitude!: number;

	@ApiProperty()
	@IsNumber()
	longitude!: number;

	@ApiProperty()
	@IsString()
	spaceId!: string;

	@ApiProperty()
	@IsString()
	tokenAddress!: string;
}
