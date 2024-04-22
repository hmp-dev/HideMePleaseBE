import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsString } from 'class-validator';

export class SelectNftDTO {
	@ApiProperty()
	@IsString()
	tokenId!: string;

	@ApiProperty()
	@IsString()
	tokenAddress!: string;

	@ApiProperty()
	@IsString()
	chain!: string;

	@ApiProperty()
	@IsString()
	walletAddress!: string;

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
