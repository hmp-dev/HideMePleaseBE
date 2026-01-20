import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { SpaceCategory, StoreStatus } from '@prisma/client';

export class GetPendingSpacesQueryDTO {
	@ApiProperty({ required: false, default: 1 })
	@IsOptional()
	@IsNumber()
	@Min(1)
	page?: number = 1;

	@ApiProperty({ required: false, default: 20 })
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(100)
	limit?: number = 20;

	@ApiProperty({ required: false, enum: StoreStatus })
	@IsOptional()
	@IsEnum(StoreStatus)
	status?: StoreStatus;
}

export class ApproveSpaceDTO {
	@ApiProperty({ description: '승인 메모', required: false })
	@IsOptional()
	@IsString()
	memo?: string;
}

export class RejectSpaceDTO {
	@ApiProperty({ description: '거부 사유' })
	@IsString()
	reason!: string;
}

export class SetOwnerDTO {
	@ApiProperty({ description: '점주 설정 사유', required: false })
	@IsOptional()
	@IsString()
	reason?: string;
}

export class AdminSpaceResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;

	@ApiProperty()
	address!: string;

	@ApiProperty({ enum: StoreStatus })
	storeStatus!: StoreStatus;

	@ApiProperty({ required: false })
	ownerName?: string;

	@ApiProperty({ required: false })
	ownerEmail?: string;

	@ApiProperty()
	createdAt!: Date;
}

export class CreateAdminSpaceDTO {
	@ApiProperty({ description: '매장 이름' })
	@IsString()
	name!: string;

	@ApiProperty({ description: '매장 이름 (영문)', required: false })
	@IsOptional()
	@IsString()
	nameEn?: string;

	@ApiProperty({ description: '위도' })
	@IsNumber()
	latitude!: number;

	@ApiProperty({ description: '경도' })
	@IsNumber()
	longitude!: number;

	@ApiProperty({ description: '주소' })
	@IsString()
	address!: string;

	@ApiProperty({ description: '주소 (영문)', required: false })
	@IsOptional()
	@IsString()
	addressEn?: string;

	@ApiProperty({ description: '웹사이트 링크', required: false })
	@IsOptional()
	@IsString()
	webLink?: string;

	@ApiProperty({ description: '영업 시작 시간' })
	@IsString()
	businessHoursStart!: string;

	@ApiProperty({ description: '영업 종료 시간' })
	@IsString()
	businessHoursEnd!: string;

	@ApiProperty({ description: '카테고리', enum: SpaceCategory })
	@IsEnum(SpaceCategory)
	category!: SpaceCategory;

	@ApiProperty({ description: '소개', required: false })
	@IsOptional()
	@IsString()
	introduction?: string;

	@ApiProperty({ description: '소개 (영문)', required: false })
	@IsOptional()
	@IsString()
	introductionEn?: string;

	@ApiProperty({ description: '이미지 ID' })
	@IsString()
	imageId!: string;

	@ApiProperty({ description: '점주 사용자 ID', required: false })
	@IsOptional()
	@IsString()
	ownerId?: string;

	@ApiProperty({ description: '상태', enum: StoreStatus, required: false })
	@IsOptional()
	@IsEnum(StoreStatus)
	storeStatus?: StoreStatus;
}
