import { Injectable } from '@nestjs/common';

import { getLoginType } from '@/api/auth/auth.utils';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class EnsureUserService {
	constructor(private prisma: PrismaService) {}

	async getOrCreateUser({
		authContext,
		name,
		email,
	}: {
		authContext: Partial<AuthContext>;
		name?: string;
		email?: string;
	}) {
		try {
			return await this.retrieveUser(authContext);
		} catch {
			return await this.createUser(authContext, { name, email });
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

	private async createUser(
		authContext: Partial<AuthContext>,
		{ name, email }: { name?: string; email?: string },
	) {
		return await this.prisma.user.create({
			data: {
				firebaseId: authContext.firebaseId,
				wldNullifierHash: authContext.nullifierHash,
				nickName: name,
				email,
				loginType: getLoginType(authContext),
			},
			select: {
				id: true,
				wldNullifierHash: true,
				firebaseId: true,
			},
		});
	}
}
