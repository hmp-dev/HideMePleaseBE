import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RedeemBenefitsDTO {
	@ApiProperty()
	@IsString()
	token!: string;

	@ApiProperty()
	@IsString()
	tokenAddress!: string;
}
