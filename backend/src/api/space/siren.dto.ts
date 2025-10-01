import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsEnum, IsNumber, MinLength, MaxLength, Min, Max } from 'class-validator';

export class CreateSirenDTO {
	@ApiProperty({
		description: '매장 ID',
	})
	@IsString()
	spaceId!: string;

	@ApiProperty({
		description: '사이렌 메시지 (1-500자)',
		minLength: 1,
		maxLength: 500,
	})
	@IsString()
	@MinLength(1)
	@MaxLength(500)
	message!: string;

	@ApiProperty({
		description: '만료일 (ISO 8601 형식)',
		example: '2025-10-15T23:59:59Z',
	})
	@IsDateString()
	expiresAt!: string;
}

export enum SirenSortBy {
	DISTANCE = 'distance',
	TIME = 'time',
}

export class GetSirensDTO {
	@ApiProperty({
		description: '정렬 기준 (distance: 거리순, time: 시간순)',
		enum: SirenSortBy,
		required: false,
		default: SirenSortBy.TIME,
	})
	@IsOptional()
	@IsEnum(SirenSortBy)
	sortBy?: SirenSortBy = SirenSortBy.TIME;

	@ApiProperty({
		description: '사용자 위도 (거리순 정렬 시 필수)',
		required: false,
	})
	@IsOptional()
	@IsNumber()
	@Min(-90)
	@Max(90)
	latitude?: number;

	@ApiProperty({
		description: '사용자 경도 (거리순 정렬 시 필수)',
		required: false,
	})
	@IsOptional()
	@IsNumber()
	@Min(-180)
	@Max(180)
	longitude?: number;

	@ApiProperty({
		description: '페이지 번호',
		required: false,
		default: 1,
	})
	@IsOptional()
	@IsNumber()
	@Min(1)
	page?: number = 1;

	@ApiProperty({
		description: '페이지당 개수',
		required: false,
		default: 20,
	})
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(100)
	limit?: number = 20;

	@ApiProperty({
		description: '특정 매장만 필터링 (옵션)',
		required: false,
	})
	@IsOptional()
	@IsString()
	spaceId?: string;
}

export class SirenAuthorInfo {
	@ApiProperty()
	userId!: string;

	@ApiProperty({ required: false })
	nickName?: string;

	@ApiProperty({ required: false })
	profileImageUrl?: string;
}

export class SirenSpaceInfo {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;

	@ApiProperty({ required: false })
	nameEn?: string;

	@ApiProperty({ required: false })
	image?: string;

	@ApiProperty()
	latitude!: number;

	@ApiProperty()
	longitude!: number;

	@ApiProperty()
	category!: string;
}

export class SirenItemResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	message!: string;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty()
	expiresAt!: Date;

	@ApiProperty()
	pointsSpent!: number;

	@ApiProperty()
	remainingDays!: number;

	@ApiProperty({ type: SirenSpaceInfo })
	space!: SirenSpaceInfo;

	@ApiProperty({ type: SirenAuthorInfo })
	author!: SirenAuthorInfo;

	@ApiProperty({ required: false, description: '사용자로부터의 거리 (미터)' })
	distance?: number;
}

export class SirenListResponse {
	@ApiProperty({ type: [SirenItemResponse] })
	sirens!: SirenItemResponse[];

	@ApiProperty()
	pagination!: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export class CreateSirenResponse {
	@ApiProperty()
	success!: boolean;

	@ApiProperty()
	sirenId!: string;

	@ApiProperty()
	pointsSpent!: number;

	@ApiProperty()
	remainingBalance!: number;
}

export class SirenStatsResponse {
	@ApiProperty({ description: '활성 사이렌 개수' })
	activeSirensCount!: number;

	@ApiProperty({ description: '전체 사이렌 개수 (만료 포함)' })
	totalSirensCount!: number;
}
