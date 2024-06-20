import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletProvider } from '@prisma/client';
import { GeoPosition } from 'geo-position.ts';

import { getCompositeTokenId } from '@/api/nft/nft.utils';
import { KlaytnNftService } from '@/modules/klaytn/klaytn-nft.service';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthContext } from '@/types';
import { EnvironmentVariables } from '@/utils/env';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class WelcomeNftService {
	private logger = new Logger(WelcomeNftService.name);

	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
		private configService: ConfigService<EnvironmentVariables, true>,
		private klaytnNftService: KlaytnNftService,
	) {}

	async getAppropriateSystemNft({
		latitude,
		longitude,
	}: {
		latitude?: number;
		longitude?: number;
	}): Promise<string> {
		if (latitude && longitude) {
			const spacesOfferingWelcomeNfts =
				await this.prisma.systemNftCollection.findMany({
					where: {
						spaceId: {
							not: null,
						},
						addressUpdated: true,
					},
					select: {
						tokenAddress: true,
						space: {
							select: {
								id: true,
								latitude: true,
								longitude: true,
							},
						},
					},
				});

			const userPosition = new GeoPosition(
				Number(latitude),
				Number(longitude),
			);
			const maxDistance = this.configService.get<number>(
				'MAX_DISTANCE_FROM_SPACE',
			);
			const spacesWithDistance = spacesOfferingWelcomeNfts.map((nft) => {
				if (!nft.space) {
					throw new InternalServerErrorException(
						ErrorCodes.UNHANDLED_ERROR,
					);
				}

				const spacePosition = new GeoPosition(
					nft.space.latitude,
					nft.space.longitude,
				);

				return {
					...nft,
					distance: Number(
						userPosition.Distance(spacePosition).toFixed(0),
					),
				};
			});

			const sortedSpaces = spacesWithDistance.sort((spaceA, spaceB) =>
				spaceA.distance > spaceB.distance ? 1 : -1,
			);

			const [nearestSpace] = sortedSpaces.filter(
				(space) => space.distance <= maxDistance,
			);
			if (nearestSpace) {
				return nearestSpace.tokenAddress;
			}
		}

		const globalNft = await this.prisma.systemNftCollection.findFirst({
			where: {
				spaceId: null,
				addressUpdated: true,
			},
			select: {
				tokenAddress: true,
			},
		});
		if (!globalNft) {
			throw new BadRequestException(ErrorCodes.MISSING_SYSTEM_NFT);
		}
		return globalNft.tokenAddress;
	}

	async getWelcomeNft({
		latitude,
		longitude,
	}: {
		latitude?: number;
		longitude?: number;
	}) {
		const systemNftAddress = await this.getAppropriateSystemNft({
			latitude,
			longitude,
		});

		const systemNft = await this.prisma.systemNftCollection.findFirst({
			where: {
				tokenAddress: systemNftAddress,
			},
			select: {
				name: true,
				tokenAddress: true,
				lastMintedTokenId: true,
				maxMintedTokens: true,
				image: true,
			},
		});

		if (!systemNft) {
			throw new BadRequestException(ErrorCodes.MISSING_SYSTEM_NFT);
		}

		const { image, lastMintedTokenId, maxMintedTokens, ...rest } =
			systemNft;

		return {
			...rest,
			totalCount: maxMintedTokens,
			usedCount: lastMintedTokenId,
			image: this.mediaService.getUrl(systemNft.image),
		};
	}

	async consumeWelcomeNft({
		request,
		tokenAddress,
	}: {
		request: Request;
		tokenAddress: string;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const user = await this.prisma.user.findFirst({
			where: {
				id: authContext.userId,
			},
			select: {
				freeNftClaimed: true,
			},
		});

		if (user?.freeNftClaimed) {
			throw new BadRequestException(ErrorCodes.FREE_NFT_ALREADY_CLAIMED);
		}

		const klipWallet = await this.prisma.wallet.findFirst({
			where: {
				userId: authContext.userId,
				provider: WalletProvider.KLIP,
			},
			select: {
				publicAddress: true,
			},
		});

		if (!klipWallet) {
			throw new BadRequestException(ErrorCodes.KLIP_WALLET_MISSING);
		}

		const systemNft = await this.prisma.systemNftCollection.findFirst({
			where: {
				tokenAddress,
			},
			select: {
				name: true,
				tokenAddress: true,
				lastMintedTokenId: true,
				maxMintedTokens: true,
				image: true,
				description: true,
			},
		});
		if (!systemNft) {
			throw new BadRequestException(ErrorCodes.MISSING_SYSTEM_NFT);
		}
		if (systemNft.lastMintedTokenId >= systemNft.maxMintedTokens) {
			throw new BadRequestException(
				ErrorCodes.SYSTEM_NFT_MINT_LIMIT_EXCEEDED,
			);
		}

		const tokenId = systemNft.lastMintedTokenId + 1;

		const tokenName = `${systemNft.name} #${tokenId}`;
		const nftMetadata = {
			attributes: [],
			description: systemNft.description || systemNft.name,
			image: this.mediaService.getUrl(systemNft.image),
			name: tokenName,
		};

		const uploadedMetadata = await this.mediaService.uploadJson(
			JSON.stringify(nftMetadata),
		);

		const mintRes = await this.klaytnNftService.mintToken({
			aliasOrAddress: tokenAddress,
			destinationWalletAddress: klipWallet.publicAddress,
			tokenId: tokenId.toString(),
			tokenUri: this.mediaService.getUrl(uploadedMetadata)!,
		});

		this.logger.log(`Result of mint token: ${JSON.stringify(mintRes)}`);

		await this.prisma.systemNft.create({
			data: {
				id: getCompositeTokenId(tokenAddress, tokenId),
				tokenAddress,
				tokenId,
				name: tokenName,
				tokenUri: this.mediaService.getUrl(uploadedMetadata)!,
				tokenFileId: uploadedMetadata.id,
				imageUrl: this.mediaService.getUrl(systemNft.image)!,
				recipientAddress: klipWallet.publicAddress,
			},
		});

		await this.prisma.systemNftCollection.update({
			where: {
				tokenAddress,
			},
			data: {
				lastMintedTokenId: tokenId,
			},
		});

		await this.prisma.user.update({
			where: {
				id: authContext.userId,
			},
			data: {
				freeNftClaimed: true,
			},
		});

		return mintRes;
	}
}
