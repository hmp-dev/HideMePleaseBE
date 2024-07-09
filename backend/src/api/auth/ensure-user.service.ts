import { Injectable } from '@nestjs/common';

import { getLoginType } from '@/api/auth/auth.utils';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SendbirdService } from '@/modules/sendbird/sendbird.service';
import { AuthContext } from '@/types';

@Injectable()
export class EnsureUserService {
	constructor(
		private prisma: PrismaService,
		private sendbirdService: SendbirdService,
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

		const chatAccessToken = await this.sendbirdService.createUser({
			userId: user.id,
			nickname: nickName || 'user',
		});

		await this.prisma.user.update({
			where: {
				id: user.id,
			},
			data: {
				chatAccessToken,
			},
		});

		return user;
	}

	private async generateNickName() {
		let digits = 3;
		const found = false;
		while (!found) {
			const newName = `HMP${100 + Math.floor(Math.random() * digits)}`;
			const existingUser = await this.prisma.user.findFirst({
				where: {
					nickName: newName,
				},
				select: { id: true },
			});

			if (!existingUser) {
				return newName;
			}
			digits++;
		}
	}
}
