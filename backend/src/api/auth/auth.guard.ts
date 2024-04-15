import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { AuthContext } from '@/types';
import { EnvironmentVariables } from '@/utils/env';
import { ErrorCodes } from '@/utils/errorCodes';

import { extractTokenFromHeader } from './auth.utils';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
		private jwtService: JwtService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();

		try {
			const token = extractTokenFromHeader(request);
			if (!token) {
				throw new UnauthorizedException(
					ErrorCodes.JWT_INVALID_OR_EXPIRED,
				);
			}

			const authContext: AuthContext = await this.jwtService.verifyAsync(
				token,
				{
					secret: this.configService.get('JWT_SECRET'),
				},
			);
			Reflect.set(request, 'authContext', authContext);
			return true;
		} catch (e: unknown) {
			throw new UnauthorizedException((e as Error).message);
		}
	}
}
