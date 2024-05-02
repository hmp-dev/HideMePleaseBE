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
				publicAddress: publicAddress.toLowerCase(),
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

	async deleteWallet({
		request,
		walletId,
	}: {
		request: Request;
		walletId: string;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		await this.prisma.wallet.delete({
			where: {
				id: walletId,
				userId: authContext.userId,
			},
		});
	}
}
