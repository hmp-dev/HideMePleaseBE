import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { GeoPosition } from 'geo-position.ts';

import { SpaceWithLocation } from '@/api/space/space.types';
import { CACHE_TTL } from '@/constants';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class SpaceLocationService {
	constructor(
		private prisma: PrismaService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

	private async getSpacesWithLocation() {
		const cacheKey = 'SPACE_WITH_LOCATIONS';
		const cachedSpaces =
			await this.cacheManager.get<SpaceWithLocation[]>(cacheKey);
		if (cachedSpaces) {
			return cachedSpaces;
		}

		const spaces = await this.prisma.space.findMany({
			select: {
				id: true,
				latitude: true,
				longitude: true,
			},
		});

		const formattedSpaces: SpaceWithLocation[] = spaces.map((space) => ({
			spaceId: space.id,
			longitude: space.longitude,
			latitude: space.latitude,
		}));

		await this.cacheManager.set(
			cacheKey,
			formattedSpaces,
			CACHE_TTL.TEN_MIN_IN_MILLISECONDS,
		);

		return formattedSpaces;
	}

	async getSpacesSortedByLocation({
		latitude,
		longitude,
	}: {
		latitude: number;
		longitude: number;
	}) {
		const spaces = await this.getSpacesWithLocation();
		const userPosition = new GeoPosition(latitude, longitude);

		const spacesWithDistance = spaces.map((space) => {
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

		return spacesWithDistance
			.sort((spaceA, spaceB) =>
				spaceA.distance > spaceB.distance ? 1 : -1,
			)
			.map((space) => space.spaceId);
	}
}
