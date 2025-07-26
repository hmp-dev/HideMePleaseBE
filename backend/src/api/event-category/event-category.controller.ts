import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { EventCategoryService } from './event-category.service';
import {
	CreateEventCategoryDto,
	UpdateEventCategoryDto,
	AssignEventCategoryToSpaceDto,
	EventCategoryResponseDto,
} from './event-category.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Event Category')
@ApiBearerAuth()
@Controller('event-category')
@UseGuards(AuthGuard)
export class EventCategoryController {
	constructor(private readonly eventCategoryService: EventCategoryService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new event category' })
	@ApiResponse({
		status: 201,
		description: 'Event category created successfully',
		type: EventCategoryResponseDto,
	})
	create(@Body() createEventCategoryDto: CreateEventCategoryDto) {
		return this.eventCategoryService.create(createEventCategoryDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all event categories' })
	@ApiQuery({
		name: 'includeInactive',
		type: 'boolean',
		required: false,
		description: 'Include inactive categories',
	})
	@ApiResponse({
		status: 200,
		description: 'List of event categories',
		type: [EventCategoryResponseDto],
	})
	findAll(@Query('includeInactive') includeInactive?: boolean) {
		return this.eventCategoryService.findAll(includeInactive);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get event category by ID' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Event category ID',
	})
	@ApiResponse({
		status: 200,
		description: 'Event category details',
		type: EventCategoryResponseDto,
	})
	findOne(@Param('id') id: string) {
		return this.eventCategoryService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update event category' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Event category ID',
	})
	@ApiResponse({
		status: 200,
		description: 'Event category updated successfully',
		type: EventCategoryResponseDto,
	})
	update(
		@Param('id') id: string,
		@Body() updateEventCategoryDto: UpdateEventCategoryDto,
	) {
		return this.eventCategoryService.update(id, updateEventCategoryDto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete event category' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Event category ID',
	})
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('id') id: string) {
		return this.eventCategoryService.remove(id);
	}

	@Post('assign-to-space')
	@ApiOperation({ summary: 'Assign event categories to a space' })
	@ApiResponse({
		status: 200,
		description: 'Event categories assigned to space successfully',
	})
	assignToSpace(@Body() assignDto: AssignEventCategoryToSpaceDto) {
		return this.eventCategoryService.assignToSpace(assignDto);
	}

	@Delete('space/:spaceId/category/:categoryId')
	@ApiOperation({ summary: 'Remove event category from space' })
	@ApiParam({
		name: 'spaceId',
		type: 'string',
		description: 'Space ID',
	})
	@ApiParam({
		name: 'categoryId',
		type: 'string',
		description: 'Event category ID',
	})
	@HttpCode(HttpStatus.NO_CONTENT)
	removeFromSpace(
		@Param('spaceId') spaceId: string,
		@Param('categoryId') categoryId: string,
	) {
		return this.eventCategoryService.removeFromSpace(spaceId, categoryId);
	}

	@Get(':id/spaces')
	@ApiOperation({ summary: 'Get all spaces in an event category' })
	@ApiParam({
		name: 'id',
		type: 'string',
		description: 'Event category ID',
	})
	@ApiResponse({
		status: 200,
		description: 'List of spaces in the event category',
	})
	getSpacesByEventCategory(@Param('id') id: string) {
		return this.eventCategoryService.getSpacesByEventCategory(id);
	}
}