import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsString } from 'class-validator';

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
