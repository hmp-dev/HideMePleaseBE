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

		if (!apiKeyInfo.userId) {
			throw new UnauthorizedException('API key is not linked to a user');
		}

		// API 키에 연결된 사용자의 권한으로 인증
		Reflect.set(request, 'authContext', {
			userId: apiKeyInfo.userId,
			isApiKey: true,
		});

		return true;
	}
}
