import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	async getOrCreateUser({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		try {
			return await this.retrieveUser(authContext);
		} catch {
			return await this.createUser(authContext);
		}
	}

	private async retrieveUser(authContext: AuthContext) {
		return this.prisma.user.findFirstOrThrow({
			where: {
				OR: [
					{
						firebaseId: authContext.firebaseId,
					},
					{
						wldNullifierHash: authContext.nullifierHash,
					},
				],
			},
		});
	}

	private async createUser(authContext: AuthContext) {
		return await this.prisma.user.create({
			data: {
				firebaseId: authContext.firebaseId,
				wldNullifierHash: authContext.nullifierHash,
			},
		});
	}
}
