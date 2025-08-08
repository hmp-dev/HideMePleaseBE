import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { WalletService } from '@/api/wallet/wallet.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SendbirdService } from '@/modules/sendbird/sendbird.service';
import { AuthContext } from '@/types';
import { EnvironmentVariables } from '@/utils/env';
import { ErrorCodes } from '@/utils/errorCodes';

import { UpdateUserProfileDTO } from './users.dto';

@Injectable()
export class UsersService {
	constructor(
		private prisma: PrismaService,
		private walletService: WalletService,
		private sendbirdService: SendbirdService,
		private configService: ConfigService<EnvironmentVariables, true>,
	) {}

	async getUserProfile({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const userProfile = await this.prisma.user.findFirst({
			where: { id: authContext.userId },
			select: {
				id: true,
				nickName: true,
				introduction: true,
				locationPublic: true,
				notificationsEnabled: true,
				chatAccessToken: true,
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

		if (!userProfile.chatAccessToken) {
			const chatAccessToken = await this.sendbirdService.createUser({
				userId: authContext.userId,
				nickname: userProfile.nickName || 'user',
			});

			await this.prisma.user.update({
				where: {
					id: authContext.userId,
				},
				data: {
					chatAccessToken,
				},
			});
			userProfile.chatAccessToken = chatAccessToken;
		}

		const { pfpNft, ...rest } = userProfile;

		return {
			...rest,
			pfpNftId: pfpNft?.id,
			pfpImageUrl: pfpNft?.imageUrl,
			chatAppId: this.configService.get<string>('SENDBIRD_APP_ID'),
		};
	}

	async updateUserProfile({
		updateUserProfileDTO: {
			nickName,
			pfpNftId,
			locationPublic,
			introduction,
			notificationsEnabled,
			fcmToken,
			profilePartsString,
			finalProfileImageUrl,
		},
		request,
	}: {
		updateUserProfileDTO: UpdateUserProfileDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const updateData: any = {};
		
		if (nickName !== undefined) updateData.nickName = nickName;
		if (introduction !== undefined) updateData.introduction = introduction;
		if (locationPublic !== undefined) updateData.locationPublic = locationPublic;
		if (pfpNftId !== undefined) updateData.pfpNftId = pfpNftId;
		if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
		if (fcmToken !== undefined) updateData.fcmToken = fcmToken;
		if (profilePartsString !== undefined) updateData.profilePartsString = profilePartsString;
		if (finalProfileImageUrl !== undefined) updateData.finalProfileImageUrl = finalProfileImageUrl;

		await this.prisma.user.update({
			where: {
				id: authContext.userId,
			},
			data: updateData,
		});

		// if (nickName) {
		// 	await this.sendbirdService.updateUser({
		// 		userId: authContext.userId,
		// 		nickname: nickName,
		// 	});
		// }
		// if (pfpNftId) {
		// 	const nft = await this.prisma.nft.findFirst({
		// 		where: {
		// 			id: pfpNftId,
		// 		},
		// 		select: {
		// 			imageUrl: true,
		// 		},
		// 	});
		// 	if (nft?.imageUrl) {
		// 		await this.sendbirdService.updateUser({
		// 			userId: authContext.userId,
		// 			profileImageUrl: nft.imageUrl,
		// 		});
		// 	}
		// }

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
				this.walletService.deleteWalletByPublicAddress(
					wallet.publicAddress,
				),
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
