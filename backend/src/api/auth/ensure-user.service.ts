import { Injectable, Logger } from '@nestjs/common';

import { getLoginType } from '@/api/auth/auth.utils';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class EnsureUserService {
	private logger = new Logger(EnsureUserService.name);

	constructor(
		private prisma: PrismaService,
	) {}

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
			const existingUser = await this.prisma.user.findFirst({
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

			if (existingUser) {
				return existingUser;
			}

			return await this.createUser(authContext, { name, email });
		} catch (error) {
			this.logger.error('Error in getOrCreateUser:', error);
			throw error;
		}
	}

	private async createUser(
		authContext: Partial<AuthContext>,
		{ name, email }: { name?: string; email?: string },
	) {
		let nickName = name;
		if (name) {
			const nicknameUser = await this.prisma.user.findFirst({
				where: {
					nickName: name,
				},
				select: {
					id: true,
				},
			});
			if (nicknameUser) {
				nickName = name + '_';
			}
		} else {
			nickName = await this.generateNickName();
		}

		const user = await this.prisma.user.create({
			data: {
				firebaseId: authContext.firebaseId,
				wldNullifierHash: authContext.nullifierHash,
				nickName,
				email,
				loginType: getLoginType(authContext),
			},
			select: {
				id: true,
				wldNullifierHash: true,
				firebaseId: true,
			},
		});

		return user;
	}

	private async generateNickName() {
		let digits = 3;
		let found = false;
		while (!found) {
			const newName = `HMP${100 + Math.floor(Math.random() * digits)}`;
			const existingUser = await this.prisma.user.findFirst({
				where: {
					nickName: newName,
				},
				select: { id: true },
			});

			if (!existingUser) {
				found = true;
				return newName;
			}
			digits++;
		}
	}
}
