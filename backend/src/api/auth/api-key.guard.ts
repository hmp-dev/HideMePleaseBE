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
		const apiKey = request.headers['x-api-key'] as string | undefined;

		if (!apiKey) {
			throw new UnauthorizedException('API key required');
		}

		const isValid = await this.apiKeyService.validateApiKey(apiKey);
		if (!isValid) {
			throw new UnauthorizedException('Invalid or expired API key');
		}

		// API 키 인증은 관리자 수준의 전체 접근 권한 부여
		Reflect.set(request, 'authContext', {
			isApiKey: true,
			isAdmin: true,
		});

		return true;
	}
}
