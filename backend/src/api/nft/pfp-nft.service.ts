import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupportedChains } from '@prisma/client';

import { getCompositeTokenId } from '@/api/nft/nft.utils';
import { MintPfpNftDto } from '@/api/nft/pfp-nft.dto';
import { AvalancheNftService } from '@/modules/avalanche/avalanche-nft.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';
import { EnvironmentVariables } from '@/utils/env';

@Injectable()
export class PfpNftService {
	private logger = new Logger(PfpNftService.name);
	private readonly PFP_COLLECTION_ADDRESS = '0x765339b4Dd866c72f3b8fb77251330744F34D1D0';

	constructor(
		private prisma: PrismaService,
		private avalancheNftService: AvalancheNftService,
		private configService: ConfigService<EnvironmentVariables, true>,
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

		this.logger.log(`Starting PFP mint for user ${authContext.userId}, wallet: ${walletAddress}`);

		// Validate wallet ownership
		const wallet = await this.prisma.wallet.findFirst({
			where: {
				publicAddress: walletAddress.toLowerCase(),
				userId: authContext.userId,
			},
		});

		if (!wallet) {
			this.logger.error(`Wallet not found for user ${authContext.userId}: ${walletAddress}`);
			throw new BadRequestException('지갑이 사용자 계정에 연결되어 있지 않습니다.');
		}

		// Use hardcoded PFP collection address
		const collectionAddress = this.PFP_COLLECTION_ADDRESS;
		this.logger.log(`Using PFP collection address: ${collectionAddress}`);

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
		this.logger.log(`Next token ID: ${nextTokenId}, Token name: ${tokenName}`);

		// Update finalProfileImageUrl before minting to ensure metadata endpoint returns correct data
		this.logger.log(`Updating user profile image before minting: ${imageUrl}`);
		await this.prisma.user.update({
			where: {
				id: authContext.userId,
			},
			data: {
				finalProfileImageUrl: imageUrl,
			},
		});

		// Validate and fix metadataUrl
		const baseUrl = this.configService.get('API_BASE_URL');
		let validMetadataUrl = metadataUrl;
		
		// Check for invalid URLs (example.com, empty, or missing proper path)
		if (!metadataUrl || 
			metadataUrl.includes('example.com') || 
			metadataUrl.includes('localhost') ||
			!metadataUrl.includes('/public/nft/user/')) {
			validMetadataUrl = `${baseUrl}/public/nft/user/${authContext.userId}/metadata`;
			this.logger.warn(`Invalid metadataUrl received: "${metadataUrl}", using server-generated: "${validMetadataUrl}"`);
		} else {
			this.logger.log(`Using client-provided metadataUrl: ${validMetadataUrl}`);
		}

		let retryCount = 0;
		const maxRetries = 3;
		let lastError: any;

		while (retryCount < maxRetries) {
			try {
				// Mint PFP NFT on Avalanche as SBT
				this.logger.log(`Minting attempt ${retryCount + 1}/${maxRetries} - PFP on Avalanche for user ${authContext.userId}`);
				this.logger.log(`Mint parameters: contractAddress=${collectionAddress}, destinationWallet=${walletAddress}, tokenUri=${validMetadataUrl}, isSBT=true`);
				
				const mintRes = await this.avalancheNftService.mintPfpToken({
					contractAddress: collectionAddress,
					destinationWalletAddress: walletAddress,
					tokenUri: validMetadataUrl,
					isSBT: true, // Set as Soul Bound Token
				});

				this.logger.log(`PFP mint successful: ${JSON.stringify(mintRes)}`);

				// Ensure collection exists BEFORE creating NFT record
				const existingCollection = await this.prisma.nftCollection.findFirst({
					where: {
						tokenAddress: collectionAddress,
					},
				});

				if (!existingCollection) {
					this.logger.log(`Creating PFP collection record for address: ${collectionAddress}`);
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
					this.logger.log(`PFP collection record created`);
				} else {
					this.logger.log(`PFP collection already exists for address: ${collectionAddress}`);
				}

				// Create NFT record with explicit error handling
				const nftId = getCompositeTokenId(collectionAddress, nextTokenId);
				this.logger.log(`Creating NFT record with ID: ${nftId}`);

				try {
					const createdNft = await this.prisma.nft.create({
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

					if (!createdNft) {
						throw new Error('NFT record creation returned null');
					}

					this.logger.log(`NFT record successfully created: ${JSON.stringify(createdNft)}`);
				} catch (nftError: any) {
					this.logger.error(`Failed to create NFT record: ${nftError.message}`);
					this.logger.error(`NFT creation error stack: ${nftError.stack}`);
					if (nftError.code) {
						this.logger.error(`Prisma error code: ${nftError.code}`);
					}
					throw new InternalServerErrorException(`NFT 레코드 생성 실패: ${nftError.message}`);
				}

				// Update user profile with PFP NFT ID (image URL was already updated before minting)
				await this.prisma.user.update({
					where: {
						id: authContext.userId,
					},
					data: {
						pfpNftId: nftId,
					},
				});
				this.logger.log(`User profile updated with PFP NFT ID`);

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

			} catch (error: any) {
				lastError = error;
				retryCount++;
				
				this.logger.error(`PFP minting attempt ${retryCount} failed:`, error);
				this.logger.error(`Error message: ${error.message}`);
				this.logger.error(`Error stack: ${error.stack}`);
				
				if (error.code) {
					this.logger.error(`Error code: ${error.code}`);
				}
				
				if (error.reason) {
					this.logger.error(`Error reason: ${error.reason}`);
				}
				
				// Check for specific error types
				if (error.message?.includes('insufficient funds')) {
					throw new BadRequestException('가스비가 부족합니다. 지갑에 AVAX를 충전해주세요.');
				}
				
				if (error.message?.includes('contract not found') || error.message?.includes('no contract code')) {
					throw new BadRequestException('PFP 컨트랙트가 배포되지 않았습니다. 관리자에게 문의해주세요.');
				}
				
				if (error.message?.includes('nonce')) {
					this.logger.warn(`Nonce error detected, waiting before retry...`);
					await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
					continue;
				}
				
				if (retryCount < maxRetries) {
					this.logger.warn(`Retrying in ${retryCount} seconds...`);
					await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
				}
			}
		}
		
		// All retries failed
		this.logger.error(`All ${maxRetries} minting attempts failed for user ${authContext.userId}`);
		throw new InternalServerErrorException(`PFP NFT 민팅 중 오류가 발생했습니다: ${lastError?.message || '알 수 없는 오류'}`);
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