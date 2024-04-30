import { Request } from 'express';

import { AuthContext } from '@/types';

export function extractTokenFromHeader(request: Request): string | undefined {
	const [type, token] = request.headers.authorization?.split(' ') ?? [];

	return type === 'Bearer' ? token : undefined;
}

export function getRolesCacheKey(authContext: AuthContext, spaceId?: string) {
	return spaceId
		? JSON.stringify(authContext) + spaceId
		: JSON.stringify(authContext);
}
