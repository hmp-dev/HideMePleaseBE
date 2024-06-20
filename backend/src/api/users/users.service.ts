import { BadRequestException, Injectable } from '@nestjs/common';

import { getWalletDeleteName } from '@/api/wallet/wallet.utils';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

import { UpdateUserProfileDTO } from './users.dto';

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	async getUserProfile({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const userProfile = await this.prisma.user.findFirst({
			where: { id: authContext.userId },
			select: {
				nickName: true,
				introduction: true,
				locationPublic: true,
				notificationsEnabled: true,
				freeNftClaimed: true,
				pfpNft: {
					select: {
						id: true,
						imageUrl: true,
					},
				},
			},
		});

		if (!userProfile) {
			throw new BadRequestException(ErrorCodes.USER_DOES_NOT_EXIST);
		}

		const { pfpNft, ...rest } = userProfile;

		return { ...rest, pfpNftId: pfpNft?.id, pfpImageUrl: pfpNft?.imageUrl };
	}

	async updateUserProfile({
		updateUserProfileDTO: {
			nickName,
			pfpNftId,
			locationPublic,
			introduction,
			notificationsEnabled,
			fcmToken,
		},
		request,
	}: {
		updateUserProfileDTO: UpdateUserProfileDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		await this.prisma.user.update({
			where: {
				id: authContext.userId,
			},
			data: {
				nickName,
				introduction,
				locationPublic,
				pfpNftId,
				notificationsEnabled,
				fcmToken,
			},
		});

		return this.getUserProfile({ request });
	}

	async deleteUser({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const user = await this.prisma.user.findFirst({
			where: {
				id: authContext.userId,
			},
			select: {
				firebaseId: true,
				wldNullifierHash: true,
				nickName: true,
				Wallets: {
					select: {
						publicAddress: true,
					},
				},
				SpaceBenefitUsageUser: {
					select: {
						id: true,
					},
				},
			},
		});

		if (!user) {
			return;
		}

		await Promise.all(
			user.Wallets.map((wallet) =>
				this.prisma.wallet.update({
					where: {
						publicAddress: wallet.publicAddress,
					},
					data: {
						deleted: true,
						publicAddress: getWalletDeleteName(
							wallet.publicAddress,
						),
					},
				}),
			),
		);

		await this.prisma.spaceBenefitUsage.deleteMany({
			where: {
				id: {
					in: user.SpaceBenefitUsageUser.map(({ id }) => id),
				},
			},
		});

		await this.prisma.nftCollectionMemberPoints.deleteMany({
			where: {
				userId: authContext.userId,
			},
		});

		await this.prisma.user.update({
			where: {
				id: authContext.userId,
			},
			data: {
				deleted: true,
				firebaseId: user.firebaseId
					? `${user.firebaseId}_deleted_${Date.now()}`
					: undefined,
				wldNullifierHash: user.wldNullifierHash
					? `${user.wldNullifierHash}_deleted_${Date.now()}`
					: undefined,
				nickName: user.nickName
					? `${user.nickName}_deleted_${Date.now()}`
					: undefined,
			},
		});
	}

	async doesUserExistByNickName(nickName: string) {
		return Boolean(
			await this.prisma.user.findFirst({
				where: {
					nickName,
				},
				select: {
					id: true,
				},
			}),
		);
	}
}
