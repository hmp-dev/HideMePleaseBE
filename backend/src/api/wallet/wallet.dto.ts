import { ApiProperty } from '@nestjs/swagger';
import { WalletProvider } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CreateWalletDTO {
	@ApiProperty()
	@IsString()
	publicAddress!: string;

	@ApiProperty()
	@IsEnum(WalletProvider)
	provider!: WalletProvider;
}
