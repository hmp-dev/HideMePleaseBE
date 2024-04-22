import { BadRequestException, Injectable } from '@nestjs/common';

import { MoralisNftService } from '@/modules/moralis/moralis-nft.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';
import { SupportedChains } from '@prisma/client';
import {
	EvmNftCollectionDataWithWallet,
	PAGE_SIZES,
} from '@/modules/moralis/moralis.constants';
import { SelectNftDTO } from '@/api/nft/nft.dto';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class NftService {
	constructor(
		private prisma: PrismaService,
		private moralisNftService: MoralisNftService,
	) {}

	getWelcomeNft({ request }: { request: Request }) {
		return Reflect.get(request, 'authContext') as AuthContext;
	}

	async getNftCollections({
		request,
		chain,
		cursor,
		cursorType,
		nextWalletAddress,
	}: {
		request: Request;
		chain: SupportedChains;
		cursor?: string;
		cursorType?: SupportedChains;
		nextWalletAddress?: string;
	}) {
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
		const walletsAfterSkip = nextWalletAddress
			? addresses.slice(addresses.indexOf(nextWalletAddress))
			: addresses;

		const walletNftCollections: EvmNftCollectionDataWithWallet[] = [];
		let next: {
			type?: SupportedChains;
			cursor?: string | null;
			nextWalletAddress?: string;
		} | null = null;

		for (const [index, walletAddress] of walletsAfterSkip.entries()) {
			const nftCollections =
				await this.moralisNftService.getWalletNFTCollections({
					walletAddress,
					chainOrChains: chain,
					cursor,
					cursorType,
				});

			const nextWallet = walletsAfterSkip[index + 1];
			if (nftCollections.next) {
				next = {
					...nftCollections.next,
					nextWalletAddress: walletAddress,
				};
			} else if (nextWallet) {
				next = { nextWalletAddress: nextWallet };
			} else {
				next = null;
			}

			walletNftCollections.push(
				...nftCollections.nftCollections.map((nftCollection) => ({
					...nftCollection.result,
					walletAddress,
				})),
			);
			if (walletNftCollections.length >= PAGE_SIZES.NFT_COLLECTIONS) {
				break;
			}
		}

		const populatedNftCollections =
			await this.moralisNftService.populateNftCollectionsWithTokens(
				walletNftCollections,
			);

		const responseCollections = populatedNftCollections.map(
			(nftCollection) => ({
				...nftCollection,
				tokens: nftCollection.tokens.map((token) => ({
					tokenId: token.tokenId,
					name: token.name,
					imageUrl: token.media?.mediaCollection?.medium.url,
				})),
			}),
		);

		return {
			collections: responseCollections,
			next,
		};
	}

	async markNftSelected({
		request,
		selectNftDTO: { walletAddress, tokenAddress, tokenId, chain },
	}: {
		request: Request;
		selectNftDTO: SelectNftDTO;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const wallet = await this.prisma.wallet.findFirst({
			where: {
				publicAddress: walletAddress,
			},
			select: {
				id: true,
			},
		});
		if (!wallet) {
			throw new BadRequestException(ErrorCodes.WALLET_DOES_NOT_EXIST);
		}

		await this.prisma.userSelectedNft.create({
			data: {
				userId:
					authContext.userId ||
					'7f4db963-8a6a-48f6-bc1f-b7dbc4fed55d',
				walletId: wallet.id,
				tokenAddress,
				tokenId,
				chain,
			},
		});
	}

	async markNftDeselected({
		request,
		selectNftDTO: { walletAddress, tokenAddress, tokenId, chain },
	}: {
		request: Request;
		selectNftDTO: SelectNftDTO;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const wallet = await this.prisma.wallet.findFirst({
			where: {
				publicAddress: walletAddress,
			},
			select: {
				id: true,
			},
		});
		if (!wallet) {
			throw new BadRequestException(ErrorCodes.WALLET_DOES_NOT_EXIST);
		}

		const selectedNft = await this.prisma.userSelectedNft.findFirst({
			where: {
				userId: authContext.userId,
				walletId: wallet.id,
				tokenAddress,
				tokenId,
				chain,
			},
			select: {
				id: true,
			},
		});
		if (!selectedNft) {
			return;
		}

		await this.prisma.userSelectedNft.delete({
			where: { id: selectedNft.id },
		});
	}
}
