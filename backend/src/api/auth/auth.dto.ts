import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FirebaseLoginDTO {
	@ApiProperty()
	@IsString()
	token!: string;
}

export class WorldcoinLoginDTO {
	@ApiProperty()
	@IsString()
	nullifierHash!: string;

	@ApiProperty()
	@IsString()
	merkleRoot!: string;

	@ApiProperty()
	@IsString()
	proof!: string;

	@ApiProperty()
	@IsString()
	verificationLevel!: string;

	@ApiProperty()
	@IsString()
	action!: string;

	@ApiProperty()
	@IsString()
	appVerifierId!: string;
}
