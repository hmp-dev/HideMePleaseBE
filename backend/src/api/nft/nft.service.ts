import { Injectable } from '@nestjs/common';

import { MoralisNftService } from '@/modules/moralis/moralis-nft.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class NftService {
	constructor(
		private prisma: PrismaService,
		private moralisNftService: MoralisNftService,
	) {}

	getWelcomeNft({ request }: { request: Request }) {
		return Reflect.get(request, 'authContext') as AuthContext;
	}

	async getNftCollections({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const userWallets = await this.prisma.wallet.findMany({
			where: {
				userId: authContext.userId,
			},
			select: {
				publicAddress: true,
			},
		});

		if (!userWallets.length) {
			return [];
		}

		const addresses = userWallets.map(({ publicAddress }) => publicAddress);

		return await Promise.all(
			addresses.map((address) =>
				this.moralisNftService.getWalletNfts(address),
			),
		);
	}
}
