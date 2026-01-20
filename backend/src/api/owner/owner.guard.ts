import {
	Injectable,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class OwnerGuard implements CanActivate {
	constructor(private prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		if (!authContext?.userId) {
			throw new ForbiddenException('인증이 필요합니다');
		}

		const user = await this.prisma.user.findUnique({
			where: { id: authContext.userId },
			select: { isOwner: true },
		});

		if (!user?.isOwner) {
			throw new ForbiddenException('점주 권한이 필요합니다');
		}

		return true;
	}
}

@Injectable()
export class OwnerSpaceGuard implements CanActivate {
	constructor(private prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const spaceId = request.params.spaceId;

		if (!spaceId) {
			return true;
		}

		const space = await this.prisma.space.findUnique({
			where: { id: spaceId },
			select: { ownerId: true },
		});

		if (!space) {
			throw new ForbiddenException('매장을 찾을 수 없습니다');
		}

		if (space.ownerId !== authContext.userId) {
			throw new ForbiddenException('해당 매장에 대한 권한이 없습니다');
		}

		return true;
	}
}
