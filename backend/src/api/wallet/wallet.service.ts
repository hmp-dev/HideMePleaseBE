import { ConflictException, Injectable } from '@nestjs/common';

import { CreateWalletDTO } from '@/api/wallet/wallet.dto';
import { getWalletDeleteName } from '@/api/wallet/wallet.utils';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

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

		try {
			const wallet = await this.prisma.wallet.create({
				data: {
					userId: authContext.userId,
					publicAddress: publicAddress.toLowerCase(),
					provider,
				},
			});

			return { ...wallet, id: wallet.publicAddress };
		} catch {
			throw new ConflictException(ErrorCodes.WALLET_ALREADY_LINKED);
		}
	}

	async getWallets({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const wallets = await this.prisma.wallet.findMany({
			where: {
				userId: authContext.userId,
			},
		});

		return wallets.map((wallet) => ({
			...wallet,
			id: wallet.publicAddress,
		}));
	}

	async deleteWallet({
		request,
		publicAddress,
	}: {
		request: Request;
		publicAddress: string;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const wallet = await this.prisma.wallet.findFirst({
			where: {
				publicAddress,
				userId: authContext.userId,
			},
			select: {
				publicAddress: true,
			},
		});

		if (!wallet) {
			return;
		}

		await this.deleteWalletByPublicAddress(wallet.publicAddress);
	}

	async deleteWalletByPublicAddress(publicAddress: string) {
		await this.prisma.nft.deleteMany({
			where: {
				ownedWalletAddress: publicAddress,
			},
		});
		await this.prisma.wallet.update({
			where: {
				publicAddress,
			},
			data: {
				publicAddress: getWalletDeleteName(publicAddress),
				deleted: true,
			},
		});
	}
}
