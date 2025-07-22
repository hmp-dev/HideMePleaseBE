import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from './space.types';

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

export class SpaceBusinessHoursDTO {
	@ApiProperty({ enum: DayOfWeek })
	@IsEnum(DayOfWeek)
	dayOfWeek!: DayOfWeek;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	openTime?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	closeTime?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	breakStartTime?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	breakEndTime?: string;

	@ApiProperty()
	@IsBoolean()
	isClosed!: boolean;
}

export class CreateSpaceDTO {
	@ApiProperty()
	@IsString()
	name!: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	nameEn?: string;

	@ApiProperty()
	@IsNumber()
	latitude!: number;

	@ApiProperty()
	@IsNumber()
	longitude!: number;

	@ApiProperty()
	@IsString()
	address!: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	addressEn?: string;

	@ApiProperty()
	@IsString()
	webLink!: string;

	@ApiProperty()
	@IsString()
	businessHoursStart!: string;

	@ApiProperty()
	@IsString()
	businessHoursEnd!: string;

	@ApiProperty()
	@IsString()
	category!: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	introduction?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	introductionEn?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	locationDescription?: string;

	@ApiProperty()
	@IsString()
	imageId!: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsBoolean()
	isTemporarilyClosed?: boolean;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	temporaryClosureReason?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	temporaryClosureEndDate?: Date;

	@ApiProperty({ type: [SpaceBusinessHoursDTO], required: false })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SpaceBusinessHoursDTO)
	businessHours?: SpaceBusinessHoursDTO[];
}

export class UpdateSpaceDTO {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	nameEn?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsNumber()
	latitude?: number;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsNumber()
	longitude?: number;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	address?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	addressEn?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	webLink?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	businessHoursStart?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	businessHoursEnd?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	category?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	introduction?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	introductionEn?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	locationDescription?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	imageId?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsBoolean()
	isTemporarilyClosed?: boolean;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	temporaryClosureReason?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	temporaryClosureEndDate?: Date;

	@ApiProperty({ type: [SpaceBusinessHoursDTO], required: false })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SpaceBusinessHoursDTO)
	businessHours?: SpaceBusinessHoursDTO[];
}
