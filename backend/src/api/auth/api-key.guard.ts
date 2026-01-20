import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiKeyService } from './api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
	constructor(private apiKeyService: ApiKeyService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();
		const apiKeyHeader = request.headers['x-api-key'] as string | undefined;

		if (!apiKeyHeader) {
			throw new UnauthorizedException('API key required');
		}

		const apiKeyInfo = await this.apiKeyService.validateApiKey(apiKeyHeader);
		if (!apiKeyInfo) {
			throw new UnauthorizedException('Invalid or expired API key');
		}

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
}
