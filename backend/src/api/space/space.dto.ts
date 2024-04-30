import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class RedeemBenefitsDTO {
	@ApiProperty()
	@IsString()
	token!: string;

	@ApiProperty()
	@IsUUID()
	nftCollectionId!: string;
}
