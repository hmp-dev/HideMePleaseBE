import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import { SupportedChains } from '@prisma/client';

import { getCompositeTokenId } from '@/api/nft/nft.utils';
import { MintPfpNftDto } from '@/api/nft/pfp-nft.dto';
import { AvalancheNftService } from '@/modules/avalanche/avalanche-nft.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';

@Injectable()
export class PfpNftService {
	private logger = new Logger(PfpNftService.name);
	private readonly PFP_COLLECTION_ADDRESS = '0x765339b4Dd866c72f3b8fb77251330744F34D1D0';

	constructor(
		private prisma: PrismaService,
		private avalancheNftService: AvalancheNftService,
	) {}

	async mintPfpNft({
		mintPfpNftDto,
		request,
	}: {
		mintPfpNftDto: MintPfpNftDto;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const { walletAddress, imageUrl, metadataUrl, name } = mintPfpNftDto;

		// Validate wallet ownership
		const wallet = await this.prisma.wallet.findFirst({
			where: {
				publicAddress: walletAddress.toLowerCase(),
				userId: authContext.userId,
			},
		});

		if (!wallet) {
			throw new BadRequestException('지갑이 사용자 계정에 연결되어 있지 않습니다.');
		}

		// Use hardcoded PFP collection address
		const collectionAddress = this.PFP_COLLECTION_ADDRESS;

		// Get next token ID for PFP collection
		const lastPfpNft = await this.prisma.nft.findFirst({
			where: {
				tokenAddress: collectionAddress,
			},
			orderBy: {
				tokenId: 'desc',
			},
			select: {
				tokenId: true,
			},
		});

		const nextTokenId = lastPfpNft ? (parseInt(lastPfpNft.tokenId) + 1) : 1;
		const tokenName = name || `PFP #${nextTokenId}`;

		try {
			// Mint PFP NFT on Avalanche as SBT
			this.logger.log(`Minting PFP on Avalanche for user ${authContext.userId}`);
			const mintRes = await this.avalancheNftService.mintPfpToken({
				contractAddress: collectionAddress,
				destinationWalletAddress: walletAddress,
				tokenUri: metadataUrl,
				isSBT: true, // Set as Soul Bound Token
			});

			this.logger.log(`PFP mint result: ${JSON.stringify(mintRes)}`);

			// Create NFT record
			const nftId = getCompositeTokenId(collectionAddress, nextTokenId);
			await this.prisma.nft.create({
				data: {
					id: nftId,
					name: tokenName,
					tokenId: nextTokenId.toString(),
					tokenAddress: collectionAddress,
					imageUrl: imageUrl,
					ownedWalletAddress: walletAddress.toLowerCase(),
					lastOwnershipCheck: new Date(),
					tokenUpdatedAt: new Date(),
					order: 0,
				},
			});

			// Update user profile with PFP
			await this.prisma.user.update({
				where: {
					id: authContext.userId,
				},
				data: {
					pfpNftId: nftId,
					finalProfileImageUrl: imageUrl,
				},
			});

			// Ensure collection exists
			const existingCollection = await this.prisma.nftCollection.findFirst({
				where: {
					tokenAddress: collectionAddress,
				},
			});

			if (!existingCollection) {
				await this.prisma.nftCollection.create({
					data: {
						name: 'PFP Collection',
						symbol: 'PFP',
						tokenAddress: collectionAddress,
						contractType: 'AVAX',
						collectionLogo: imageUrl,
						chain: SupportedChains.AVALANCHE,
						category: null, // PFP is not in SpaceCategory enum
					},
				});
			}

			return {
				success: true,
				nftId: nftId,
				tokenId: nextTokenId,
				tokenAddress: collectionAddress,
				transactionHash: mintRes?.transactionHash || mintRes?.hash,
				imageUrl: imageUrl,
				chain: 'AVALANCHE',
				message: 'PFP NFT가 성공적으로 민팅되었습니다.',
			};

		} catch (error) {
			this.logger.error('PFP minting failed:', error);
			throw new InternalServerErrorException('PFP NFT 민팅 중 오류가 발생했습니다.');
		}
	}

	async getUserPfpNft({ userId }: { userId: string }) {
		const user = await this.prisma.user.findFirst({
			where: {
				id: userId,
			},
			select: {
				pfpNftId: true,
				finalProfileImageUrl: true,
			},
		});

		if (!user?.pfpNftId) {
			return null;
		}

		const pfpNft = await this.prisma.nft.findFirst({
			where: {
				id: user.pfpNftId,
			},
			select: {
				id: true,
				name: true,
				tokenId: true,
				tokenAddress: true,
				imageUrl: true,
				ownedWalletAddress: true,
			},
		});

		return pfpNft;
	}
}