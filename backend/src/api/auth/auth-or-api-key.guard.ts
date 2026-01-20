import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { ApiKeyService } from './api-key.service';
import { extractTokenFromHeader } from './auth.utils';
import { AuthContext } from '@/types';
import { EnvironmentVariables } from '@/utils/env';

@Injectable()
export class AuthOrApiKeyGuard implements CanActivate {
	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
		private jwtService: JwtService,
		private apiKeyService: ApiKeyService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();

		// 1. X-API-Key 헤더 확인
		const apiKeyHeader = request.headers['x-api-key'] as string | undefined;
		if (apiKeyHeader) {
			const apiKeyInfo = await this.apiKeyService.validateApiKey(apiKeyHeader);
			if (apiKeyInfo) {
				if (apiKeyInfo.isAdmin) {
					// 관리자 API 키: 전체 권한
					Reflect.set(request, 'authContext', {
						isApiKey: true,
						isAdmin: true,
					});
				} else if (apiKeyInfo.userId) {
					// 사용자 연결 API 키: 해당 사용자 권한
					Reflect.set(request, 'authContext', {
						userId: apiKeyInfo.userId,
						isApiKey: true,
					});
				} else {
					throw new UnauthorizedException('API key requires userId or isAdmin');
				}
				return true;
			}
			throw new UnauthorizedException('Invalid or expired API key');
		}

		// 2. Bearer 토큰 확인
		const token = extractTokenFromHeader(request);
		if (token) {
			try {
				const authContext: AuthContext = await this.jwtService.verifyAsync(
					token,
					{
						secret: this.configService.get('JWT_SECRET'),
					},
				);
				Reflect.set(request, 'authContext', authContext);
				return true;
			} catch {
				throw new UnauthorizedException('Invalid or expired token');
			}
		}

		throw new UnauthorizedException('Authentication required');
	}
}
