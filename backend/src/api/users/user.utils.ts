import { LoginType } from '@prisma/client';

import { AuthContext } from '@/types';

export function userIdToRequest(userId: string) {
	const authContext: AuthContext = {
		loginType: LoginType.FIREBASE,
		userId,
	};

	const request = {} as Request;
	Reflect.set(request, 'authContext', authContext);

	return request;
}
