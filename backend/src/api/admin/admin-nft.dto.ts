import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class NftAttributeDTO {
	@ApiProperty()
	@IsString()
	trait_type!: string;

	@ApiProperty()
	value!: string | number;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	display_type?: string;
}

export class CreateUserNftMetadataDTO {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	imageUrl?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	imagePath?: string;

	@ApiProperty({ required: false, type: [NftAttributeDTO] })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => NftAttributeDTO)
	attributes?: NftAttributeDTO[];

	@ApiProperty({ required: false })
	@IsOptional()
	@IsUrl()
	externalUrl?: string;
}

export class UpdateUserNftMetadataDTO extends CreateUserNftMetadataDTO {}

export class SetUserImageDTO {
	@ApiProperty({ required: false, description: '외부 이미지 URL' })
	@IsOptional()
	@IsUrl()
	imageUrl?: string;

	@ApiProperty({ required: false, description: '로컬 파일 경로' })
	@IsOptional()
	@IsString()
	imagePath?: string;
}