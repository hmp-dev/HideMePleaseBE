import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SpaceUserRole } from '@prisma/client';
import { type Cache } from 'cache-manager';
import { validate as isValidUUID } from 'uuid';

import { AllRoles } from '@/api/auth/auth.types';
import { getRolesCacheKey } from '@/api/auth/auth.utils';
import { CACHE_TTL } from '@/constants';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class AccessControlService {
	constructor(
		private prisma: PrismaService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

	async canAccessResource(
		authContext: AuthContext,
		requiredRoles: AllRoles[],
		spaceId?: string,
	) {
		const userRoles = await this.getRoles(authContext, spaceId);
		return requiredRoles.some((requiredRole) =>
			userRoles.has(requiredRole),
		);
	}

	private async getRoles(
		authContext: AuthContext,
		spaceId?: string,
	): Promise<Set<AllRoles>> {
		const cacheKey = getRolesCacheKey(authContext, spaceId);
		const cachedRoles = await this.cacheManager.get<AllRoles[]>(cacheKey);
		if (cachedRoles) {
			return new Set(cachedRoles);
		}

		const { userId } = authContext;

		if (spaceId && !isValidUUID(spaceId)) {
			throw new BadRequestException(ErrorCodes.INVALID_SPACE_ID);
		}
		let spaceRoles: { role: SpaceUserRole }[] = [];
		if (spaceRoles) {
			spaceRoles = await this.prisma.spaceUser.findMany({
				where: {
					userId,
					spaceId,
				},
				select: {
					role: true,
				},
			});
		}

		const allRoles = [...spaceRoles.map(({ role }) => role)];

		await this.cacheManager.set(
			cacheKey,
			allRoles,
			CACHE_TTL.ONE_MIN_IN_MILLISECONDS,
		);

		return new Set(allRoles);
	}
}
