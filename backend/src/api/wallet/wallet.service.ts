import { Injectable } from '@nestjs/common';

import { CreateWalletDTO } from '@/api/wallet/wallet.dto';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class WalletService {
	constructor(private prisma: PrismaService) {}

	async createWallet({
		request,
		createWalletDTO: { publicAddress, provider },
	}: {
		request: Request;
		createWalletDTO: CreateWalletDTO;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		return await this.prisma.wallet.create({
			data: {
				userId: authContext.userId,
				publicAddress,
				provider,
			},
		});
	}

	async getWallets({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		return await this.prisma.wallet.findMany({
			where: {
				userId: authContext.userId,
			},
		});
	}
}
