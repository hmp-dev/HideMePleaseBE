import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class EnsureUserService {
	constructor(private prisma: PrismaService) {}

	async getOrCreateUser({
		authContext,
		name,
	}: {
		authContext: Partial<AuthContext>;
		name?: string;
	}) {
		try {
			return await this.retrieveUser(authContext);
		} catch {
			return await this.createUser(authContext, name);
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

	private async createUser(authContext: Partial<AuthContext>, name?: string) {
		return await this.prisma.user.create({
			data: {
				firebaseId: authContext.firebaseId,
				wldNullifierHash: authContext.nullifierHash,
				nickName: name,
			},
			select: {
				id: true,
				wldNullifierHash: true,
				firebaseId: true,
			},
		});
	}
}
