import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateEventCategoryDto {
	@ApiProperty({
		description: 'Event category name',
		example: '할로윈 이벤트',
	})
	@IsString()
	name: string;

	@ApiProperty({
		description: 'Event category name in English',
		example: 'Halloween Event',
		required: false,
	})
	@IsString()
	@IsOptional()
	nameEn?: string;

	@ApiProperty({
		description: 'Event category description',
		example: '할로윈 특별 이벤트를 진행하는 매장',
		required: false,
	})
	@IsString()
	@IsOptional()
	description?: string;

	@ApiProperty({
		description: 'Event category description in English',
		example: 'Stores with special Halloween events',
		required: false,
	})
	@IsString()
	@IsOptional()
	descriptionEn?: string;

	@ApiProperty({
		description: 'Display order',
		example: 1,
		required: false,
		default: 0,
	})
	@IsNumber()
	@IsOptional()
	displayOrder?: number;

	@ApiProperty({
		description: 'Whether the category is active',
		example: true,
		required: false,
		default: true,
	})
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;

	@ApiProperty({
		description: 'Category color code',
		example: '#FF5733',
		required: false,
	})
	@IsString()
	@IsOptional()
	colorCode?: string;

	@ApiProperty({
		description: 'Category icon URL',
		example: 'https://example.com/icon.png',
		required: false,
	})
	@IsString()
	@IsOptional()
	iconUrl?: string;
}

export class UpdateEventCategoryDto extends CreateEventCategoryDto {}

export class AssignEventCategoryToSpaceDto {
	@ApiProperty({
		description: 'Space ID',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@IsUUID()
	spaceId: string;

	@ApiProperty({
		description: 'Event category IDs to assign',
		example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
		type: [String],
	})
	@IsUUID('all', { each: true })
	eventCategoryIds: string[];
}

export class EventCategoryResponseDto {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ required: false })
	nameEn?: string;

	@ApiProperty({ required: false })
	description?: string;

	@ApiProperty({ required: false })
	descriptionEn?: string;

	@ApiProperty()
	displayOrder: number;

	@ApiProperty()
	isActive: boolean;

	@ApiProperty({ required: false })
	colorCode?: string;

	@ApiProperty({ required: false })
	iconUrl?: string;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;
}