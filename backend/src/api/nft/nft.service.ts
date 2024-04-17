import { Injectable } from '@nestjs/common';

import { AuthContext } from '@/types';

@Injectable()
export class NftService {
	getWelcomeNft({ request }: { request: Request }) {
		return Reflect.get(request, 'authContext') as AuthContext;
	}
}
