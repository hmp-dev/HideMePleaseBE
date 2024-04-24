import { BadRequestException, Injectable } from '@nestjs/common';

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
		},
		request,
	}: {
		updateUserProfileDTO: UpdateUserProfileDTO;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		console.log(nickName, pfpNftId, locationPublic, introduction);
		await this.prisma.user.update({
			where: {
				id: authContext.userId,
			},
			data: {
				nickName,
				introduction,
				locationPublic,
				pfpNftId,
			},
		});

		return this.getUserProfile({ request });
	}
}
