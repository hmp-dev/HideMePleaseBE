import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import { SupportedChains, Wallet, WalletProvider } from '@prisma/client';
import { GeoPosition } from 'geo-position.ts';

import { getCompositeTokenId } from '@/api/nft/nft.utils';
import { MAX_SELECTED_NFTS } from '@/constants';
import { KlaytnNftService } from '@/modules/klaytn/klaytn-nft.service';
import { MediaService } from '@/modules/media/media.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SendbirdService } from '@/modules/sendbird/sendbird.service';
import { SystemConfigService } from '@/modules/system-config/system-config.service';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class WelcomeNftService {
	private logger = new Logger(WelcomeNftService.name);

	constructor(
		private prisma: PrismaService,
		private mediaService: MediaService,
		private klaytnNftService: KlaytnNftService,
		private systemConfig: SystemConfigService,
		private sendbirdService: SendbirdService,
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
						maxDistanceFromSpace: true,
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
			const maxDistance = (await this.systemConfig.get())
				.maxDistanceFromSpace;

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
				(space) =>
					space.distance <=
					(space.maxDistanceFromSpace ?? maxDistance),
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
		request,
	}: {
		latitude?: number;
		longitude?: number;
		request: Request;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const userClaimedNfts = (
			await this.prisma.systemNft.findMany({
				where: {
					userId: authContext.userId,
				},
				select: {
					tokenAddress: true,
				},
			})
		).map((nft) => nft.tokenAddress);

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
				redeemTermsUrl: true,
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
			freeNftAvailable: !userClaimedNfts.includes(systemNftAddress),
		};
	}

	getFreeNftWalletAddress(
		wallets: Pick<Wallet, 'provider' | 'publicAddress'>[],
	) {
		const wepinWallet = wallets.find(
			(wallet) => wallet.provider === WalletProvider.WEPIN_EVM,
		);
		if (wepinWallet) {
			return wepinWallet.publicAddress;
		}

		const klipWallet = wallets.find(
			(wallet) => wallet.provider === WalletProvider.KLIP,
		);
		if (klipWallet) {
			return klipWallet.publicAddress;
		}

		throw new InternalServerErrorException(
			ErrorCodes.UNHANDLED_STATE_INVALID_PROVIDERS,
		);
	}

	async consumeWelcomeNft({
		request,
		tokenAddress,
	}: {
		request: Request;
		tokenAddress: string;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const userClaimedNfts = (
			await this.prisma.systemNft.findMany({
				where: {
					userId: authContext.userId,
				},
				select: {
					tokenAddress: true,
				},
			})
		).map((nft) => nft.tokenAddress);

		if (userClaimedNfts.includes(tokenAddress)) {
			throw new BadRequestException(ErrorCodes.FREE_NFT_ALREADY_CLAIMED);
		}

		const klipCompatibleWallets = await this.prisma.wallet.findMany({
			where: {
				userId: authContext.userId,
				provider: {
					in: [WalletProvider.KLIP, WalletProvider.WEPIN_EVM],
				},
			},
			select: {
				publicAddress: true,
				provider: true,
			},
		});
		if (!klipCompatibleWallets.length) {
			throw new BadRequestException(ErrorCodes.KLIP_WALLET_MISSING);
		}

		const freeNftWalletAddress = this.getFreeNftWalletAddress(
			klipCompatibleWallets,
		);

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
				symbol: true,
				contractType: true,
				category: true,
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
			sendable: false,
		};

		const uploadedMetadata = await this.mediaService.uploadJson(
			JSON.stringify(nftMetadata),
		);

		const mintRes = await this.klaytnNftService.mintToken({
			aliasOrAddress: tokenAddress,
			destinationWalletAddress: freeNftWalletAddress,
			tokenId: tokenId.toString(),
			tokenUri: this.mediaService.getUrl(uploadedMetadata)!,
		});

		this.logger.log(`Result of mint token: ${JSON.stringify(mintRes)}`);

		await Promise.all([
			this.prisma.systemNft.create({
				data: {
					id: getCompositeTokenId(tokenAddress, tokenId),
					tokenAddress,
					tokenId,
					name: tokenName,
					tokenUri: this.mediaService.getUrl(uploadedMetadata)!,
					tokenFileId: uploadedMetadata.id,
					imageUrl: this.mediaService.getUrl(systemNft.image)!,
					recipientAddress: freeNftWalletAddress,
					userId: authContext.userId,
				},
			}),
			this.prisma.systemNftCollection.update({
				where: {
					tokenAddress,
				},
				data: {
					lastMintedTokenId: tokenId,
				},
			}),
		]);

		try {
			await this.prisma.nftCollection.create({
				data: {
					name: systemNft.name,
					symbol: systemNft.symbol,
					tokenAddress: systemNft.tokenAddress,
					contractType: systemNft.contractType,
					collectionLogo: this.mediaService.getUrl(systemNft.image),
					chain: SupportedChains.KLAYTN,
					category: systemNft.category,
				},
			});
			try {
				await this.sendbirdService.createGroupChannel({
					channelUrl: systemNft.tokenAddress,
					channelImageURl: this.mediaService.getUrl(systemNft.image)!,
					name: systemNft.name,
					userIds: [authContext.userId],
				});
			} catch (e) {
				this.logger.error(e);
			}
			await this.prisma.nftCollection.update({
				where: {
					tokenAddress: systemNft.tokenAddress,
				},
				data: {
					chatChannelCreated: true,
				},
			});
		} catch (e) {
			this.logger.log(
				`nftCollection already created : ${systemNft.tokenAddress}`,
			);
		}

		try {
			await this.sendbirdService.addUserToGroupChannel({
				userId: authContext.userId,
				channelUrl: systemNft.tokenAddress,
			});
		} catch (e) {
			this.logger.error(e);
		}
		await this.makeSpaceForFreeNftToken(authContext.userId);
		await this.prisma.nft.create({
			data: {
				id: getCompositeTokenId(tokenAddress, tokenId),
				name: tokenName,
				tokenId: tokenId.toString(),
				tokenAddress,
				imageUrl: this.mediaService.getUrl(systemNft.image)!,
				ownedWalletAddress: freeNftWalletAddress,
				lastOwnershipCheck: new Date(),
				tokenUpdatedAt: new Date(),
				order: 0,
			},
		});

		return mintRes;
	}

	async makeSpaceForFreeNftToken(userId: string) {
		let selectedNfts = await this.prisma.nft.findMany({
			where: {
				ownedWallet: {
					userId,
				},
			},
			select: {
				id: true,
				order: true,
			},
			orderBy: {
				createdAt: 'asc',
			},
		});

		if (selectedNfts.length === MAX_SELECTED_NFTS) {
			const [firstNft] = selectedNfts;

			await this.prisma.nft.delete({
				where: {
					id: firstNft.id,
				},
			});
			selectedNfts = selectedNfts.filter((nft) => nft.id !== firstNft.id);
		}

		await Promise.all(
			selectedNfts.map((nft) =>
				this.prisma.nft.update({
					data: {
						order: nft.order + 1,
					},
					where: {
						id: nft.id,
					},
				}),
			),
		);
	}
}
