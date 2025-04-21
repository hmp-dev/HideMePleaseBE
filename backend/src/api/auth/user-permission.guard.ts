import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { AccessControlService } from '@/api/auth/access-control.service';
import { AllRoles } from '@/api/auth/auth.types';
import { AuthContext } from '@/types';

@Injectable()
export class UserPermissionsGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private accessControlService: AccessControlService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const roles = this.reflector.get<AllRoles[] | undefined>(
			'roles',
			context.getHandler(),
		);
		if (!roles) {
			return true;
		}

		const request = context.switchToHttp().getRequest<Request>();

		const spaceId = Reflect.get(request.params, 'spaceId') as
			| string
			| undefined;
		const authContext = Reflect.get(request, 'authContext') as
			| AuthContext
			| undefined;

		if (!authContext) {
			throw new UnauthorizedException();
		}

		return await this.accessControlService.canAccessResource(
			authContext,
			roles,
			spaceId,
		);
	}
}
