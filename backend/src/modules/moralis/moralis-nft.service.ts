import { Injectable } from '@nestjs/common';
import { SupportedChains } from '@prisma/client';

import { MoralisApiService } from '@/modules/moralis/moralis-api.service';
import {
	SupportedChainMapping,
	SupportedChainsList,
} from '@/modules/web3/web3.constants';

@Injectable()
export class MoralisNftService {
	constructor(private moralisApiService: MoralisApiService) {}

	async getWalletNfts(
		walletAddress: string,
		chainOrChains:
			| SupportedChains
			| SupportedChains[] = SupportedChainsList,
	) {
		const chains = Array.isArray(chainOrChains)
			? chainOrChains
			: [chainOrChains];

		const chainWiseNfts = await Promise.all(
			chains.map((chain) =>
				this.moralisApiService.getWalletNFTs({
					address: walletAddress,
					chain: SupportedChainMapping[chain].hex,
				}),
			),
		);

		return chainWiseNfts.map((nft) => nft.result);
	}
}
