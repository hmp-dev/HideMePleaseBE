import { LoginType } from '@prisma/client';
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

export function getLoginType(authContext: Partial<AuthContext>): LoginType {
	if (authContext.firebaseId) {
		return LoginType.FIREBASE;
	}
	return LoginType.WORLD_ID;
}

export function worldAuthTokenCacheKey(appVerifierId: string) {
	return `APP_VERIFIER_${appVerifierId}`;
}
