import { Injectable } from '@nestjs/common';
import { WalletProvider } from '@prisma/client';

import { CreateWalletDTO } from '@/api/wallet/wallet.dto';
import { getWalletDeleteName } from '@/api/wallet/wallet.utils';
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

		// Normalize address based on provider
		const normalizedAddress =
			provider === WalletProvider.PHANTOM ||
			provider === WalletProvider.WEPIN_SOLANA
				? publicAddress
				: publicAddress.toLowerCase();

		// Check if wallet already exists - if so, return existing wallet
		const existingWallet = await this.prisma.wallet.findUnique({
			where: {
				publicAddress: normalizedAddress,
			},
		});

		if (existingWallet) {
			return { ...existingWallet, id: existingWallet.publicAddress };
		}

		// Create new wallet if it doesn't exist
		const wallet = await this.prisma.wallet.create({
			data: {
				userId: authContext.userId,
				publicAddress: normalizedAddress,
				provider,
			},
		});

		return { ...wallet, id: wallet.publicAddress };
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
