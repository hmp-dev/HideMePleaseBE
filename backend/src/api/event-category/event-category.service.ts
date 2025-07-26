import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/services/prisma.service';
import {
	CreateEventCategoryDto,
	UpdateEventCategoryDto,
	AssignEventCategoryToSpaceDto,
} from './event-category.dto';

@Injectable()
export class EventCategoryService {
	constructor(private prisma: PrismaService) {}

	async create(createEventCategoryDto: CreateEventCategoryDto) {
		try {
			return await this.prisma.eventCategory.create({
				data: createEventCategoryDto,
			});
		} catch (error) {
			if (error.code === 'P2002') {
				throw new ConflictException('Event category with this name already exists');
			}
			throw error;
		}
	}

	async findAll(includeInactive = false) {
		return await this.prisma.eventCategory.findMany({
			where: {
				deleted: false,
				...(includeInactive ? {} : { isActive: true }),
			},
			orderBy: [
				{ displayOrder: 'asc' },
				{ name: 'asc' },
			],
		});
	}

	async findOne(id: string) {
		const eventCategory = await this.prisma.eventCategory.findFirst({
			where: {
				id,
				deleted: false,
			},
			include: {
				SpaceEventCategory: {
					include: {
						space: {
							select: {
								id: true,
								name: true,
								nameEn: true,
								category: true,
							},
						},
					},
				},
			},
		});

		if (!eventCategory) {
			throw new NotFoundException('Event category not found');
		}

		return eventCategory;
	}

	async update(id: string, updateEventCategoryDto: UpdateEventCategoryDto) {
		await this.findOne(id); // Check if exists

		try {
			return await this.prisma.eventCategory.update({
				where: { id },
				data: updateEventCategoryDto,
			});
		} catch (error) {
			if (error.code === 'P2002') {
				throw new ConflictException('Event category with this name already exists');
			}
			throw error;
		}
	}

	async remove(id: string) {
		await this.findOne(id); // Check if exists

		return await this.prisma.eventCategory.update({
			where: { id },
			data: { deleted: true },
		});
	}

	async assignToSpace(assignDto: AssignEventCategoryToSpaceDto) {
		const { spaceId, eventCategoryIds } = assignDto;

		// Verify space exists
		const space = await this.prisma.space.findFirst({
			where: { id: spaceId, deleted: false },
		});

		if (!space) {
			throw new NotFoundException('Space not found');
		}

		// Verify all event categories exist
		const eventCategories = await this.prisma.eventCategory.findMany({
			where: {
				id: { in: eventCategoryIds },
				deleted: false,
				isActive: true,
			},
		});

		if (eventCategories.length !== eventCategoryIds.length) {
			throw new NotFoundException('One or more event categories not found or inactive');
		}

		// Remove existing associations
		await this.prisma.spaceEventCategory.deleteMany({
			where: { spaceId },
		});

		// Create new associations
		const createData = eventCategoryIds.map(eventCategoryId => ({
			spaceId,
			eventCategoryId,
		}));

		await this.prisma.spaceEventCategory.createMany({
			data: createData,
			skipDuplicates: true,
		});

		// Return updated space with event categories
		return await this.prisma.space.findUnique({
			where: { id: spaceId },
			include: {
				SpaceEventCategory: {
					include: {
						eventCategory: true,
					},
				},
			},
		});
	}

	async removeFromSpace(spaceId: string, eventCategoryId: string) {
		const association = await this.prisma.spaceEventCategory.findFirst({
			where: {
				spaceId,
				eventCategoryId,
			},
		});

		if (!association) {
			throw new NotFoundException('Space-EventCategory association not found');
		}

		return await this.prisma.spaceEventCategory.delete({
			where: {
				id: association.id,
			},
		});
	}

	async getSpacesByEventCategory(eventCategoryId: string) {
		await this.findOne(eventCategoryId); // Check if exists

		return await this.prisma.space.findMany({
			where: {
				deleted: false,
				SpaceEventCategory: {
					some: {
						eventCategoryId,
					},
				},
			},
			include: {
				SpaceEventCategory: {
					where: {
						eventCategoryId,
					},
					include: {
						eventCategory: true,
					},
				},
			},
		});
	}
}