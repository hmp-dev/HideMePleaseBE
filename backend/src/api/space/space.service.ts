import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeoPosition } from 'geo-position.ts';

import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { EnvironmentVariables } from '@/utils/env';

@Injectable()
export class SpaceService {
	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
		private configService: ConfigService<EnvironmentVariables, true>,
	) {}

	async getNearestSpaces({
		latitude,
		longitude,
	}: {
		request: Request;
		latitude: number;
		longitude: number;
	}) {
		const userPosition = new GeoPosition(latitude, longitude);

		const spaces = await this.prisma.space.findMany({
			select: {
				id: true,
				name: true,
				latitude: true,
				longitude: true,
				address: true,
				image: true,
			},
		});

		const maxDistance = this.configService.get<number>(
			'MAX_DISTANCE_FROM_SPACE',
		);

		const spacesWithDistance = spaces.map((space) => {
			const spacePosition = new GeoPosition(
				space.latitude,
				space.longitude,
			);

			return {
				...space,
				image: this.mediaService.getUrl(space.image),
				distance: Number(
					userPosition.Distance(spacePosition).toFixed(0),
				),
			};
		});

		return spacesWithDistance
			.filter((space) => space.distance <= maxDistance)
			.sort((spaceA, spaceB) =>
				spaceA.distance > spaceB.distance ? 1 : -1,
			);
	}
}
