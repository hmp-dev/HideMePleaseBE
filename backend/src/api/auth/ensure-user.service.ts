import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class EnsureUserService {
	constructor(private prisma: PrismaService) {}

	async getOrCreateUser({
		authContext,
	}: {
		authContext: Partial<AuthContext>;
	}) {
		try {
			return await this.retrieveUser(authContext);
		} catch {
			return await this.createUser(authContext);
		}
	}

	private async retrieveUser(authContext: Partial<AuthContext>) {
		return this.prisma.user.findFirstOrThrow({
			where: {
				OR: [
					{
						id: authContext.userId,
					},
					{
						firebaseId: authContext.firebaseId,
					},
					{
						wldNullifierHash: authContext.nullifierHash,
					},
				],
			},
			select: {
				id: true,
				wldNullifierHash: true,
				firebaseId: true,
			},
		});
	}

	private async createUser(authContext: Partial<AuthContext>) {
		return await this.prisma.user.create({
			data: {
				firebaseId: authContext.firebaseId,
				wldNullifierHash: authContext.nullifierHash,
			},
			select: {
				id: true,
				wldNullifierHash: true,
				firebaseId: true,
			},
		});
	}
}
