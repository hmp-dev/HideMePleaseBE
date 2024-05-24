import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { subHours } from 'date-fns';
import { GeoPosition } from 'geo-position.ts';

import { LOCATION_VALIDITY_IN_HOURS } from '@/api/users/users.constants';
import { UpdateLastKnownLocationDTO } from '@/api/users/users.dto';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';
import { EnvironmentVariables } from '@/utils/env';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class UserLocationService {
	constructor(
		private prisma: PrismaService,
		private configService: ConfigService<EnvironmentVariables, true>,
	) {}

	async updateUserLocation({
		request,
		updateLastKnownLocationDTO: {
			latitude,
			longitude,
			spaceId: suggestedSpaceId,
		},
	}: {
		request: Request;
		updateLastKnownLocationDTO: UpdateLastKnownLocationDTO;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const user = await this.prisma.user.findFirst({
			where: {
				id: authContext.userId,
			},
			select: {
				locationPublic: true,
			},
		});

		if (!user) {
			throw new NotFoundException(ErrorCodes.ENTITY_NOT_FOUND);
		}

		if (!user.locationPublic) {
			return;
		}

		const allSpaces = await this.prisma.space.findMany({
			select: {
				id: true,
				latitude: true,
				longitude: true,
			},
			where: {
				id: suggestedSpaceId,
			},
		});

		const userPosition = new GeoPosition(latitude, longitude);
		const maxDistance = this.configService.get<number>(
			'MAX_DISTANCE_FROM_SPACE',
		);
		const spacesWithDistance = allSpaces.map((space) => {
			const spacePosition = new GeoPosition(
				space.latitude,
				space.longitude,
			);

			return {
				...space,
				distance: Number(
					userPosition.Distance(spacePosition).toFixed(0),
				),
			};
		});

		const filteredSpaces = spacesWithDistance
			.filter((space) => space.distance <= maxDistance)
			.sort((spaceA, spaceB) =>
				spaceA.distance > spaceB.distance ? 1 : -1,
			);

		const [nearestSpace] = filteredSpaces;

		if (!nearestSpace) {
			return;
		}

		await this.prisma.userLastKnownSpace.create({
			data: {
				spaceId: nearestSpace.id,
				userId: authContext.userId,
			},
		});
	}

	async getNumberOfUsersHidingInSpaces(spaceIdOrSpaceIds: string[] | string) {
		const spaceIds = Array.isArray(spaceIdOrSpaceIds)
			? spaceIdOrSpaceIds
			: [spaceIdOrSpaceIds];

		const lastKnownLocations =
			await this.prisma.userLastKnownSpace.findMany({
				where: {
					spaceId: {
						in: spaceIds,
					},
					createdAt: {
						gte: subHours(new Date(), LOCATION_VALIDITY_IN_HOURS),
					},
				},
				select: { userId: true, spaceId: true },
			});

		const spaceUserCounter: Record<string, Set<string>> = {};
		for (const user of lastKnownLocations) {
			if (!spaceUserCounter[user.spaceId]) {
				spaceUserCounter[user.spaceId] = new Set<string>();
			}

			spaceUserCounter[user.spaceId].add(user.userId);
		}

		const spaceUserCount: Record<string, number> = {};
		Object.entries(spaceUserCounter).forEach(
			([spaceId, spaceUsers]) =>
				(spaceUserCount[spaceId] = spaceUsers.size),
		);

		return spaceUserCount;
	}
}
