import { BadRequestException, Injectable } from '@nestjs/common';

import { UsersService } from '@/api/users/users.service';
import { CreateWalletDTO } from '@/api/wallet/wallet.dto';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class WalletService {
	constructor(
		private prisma: PrismaService,
		private usersService: UsersService,
	) {}

	async createWallet({
		request,
		createWalletDTO: { publicAddress, provider },
	}: {
		request: Request;
		createWalletDTO: CreateWalletDTO;
	}) {
		const user = await this.usersService.getOrCreateUser({ request });
		if (!user) {
			throw new BadRequestException(ErrorCodes.USER_DOES_NOT_EXIST);
		}

		return await this.prisma.wallet.create({
			data: {
				userId: user.id,
				publicAddress,
				provider,
			},
		});
	}

	async getWallets({ request }: { request: Request }) {
		const user = await this.usersService.getOrCreateUser({ request });
		if (!user) {
			throw new BadRequestException(ErrorCodes.USER_DOES_NOT_EXIST);
		}

		return await this.prisma.wallet.findMany({
			where: {
				userId: user.id,
			},
		});
	}
}
