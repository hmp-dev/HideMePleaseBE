import { EvmAddress } from '@moralisweb3/common-evm-utils';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Nft, SupportedChains } from '@prisma/client';

import { SelectedNftOrderDTO, SelectNftDTO } from '@/api/nft/nft.dto';
import { MediaService } from '@/modules/media/media.service';
import {
	EvmNftCollectionDataWithWallet,
	PAGE_SIZES,
} from '@/modules/moralis/moralis.constants';
import { MoralisNftService } from '@/modules/moralis/moralis-nft.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SupportedChainReverseMapping } from '@/modules/web3/web3.constants';
import { AuthContext } from '@/types';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class NftService {
	constructor(
		private prisma: PrismaService,
		private moralisNftService: MoralisNftService,
		private mediaService: MediaService,
	) {}

	async getWelcomeNft() {
		const [welcomeNft, totalCount, usedCount] = await Promise.all([
			this.prisma.welcomeNft.findFirst({
				select: {
					id: true,
					image: true,
				},
				where: {
					used: false,
				},
				orderBy: {
					createdAt: 'asc',
				},
			}),
			this.prisma.welcomeNft.count(),
			this.prisma.welcomeNft.count({
				where: {
					used: true,
				},
			}),
		]);
		if (!welcomeNft) {
			throw new BadRequestException(ErrorCodes.MISSING_WELCOME_NFT);
		}
		return {
			...welcomeNft,
			totalCount,
			usedCount,
			image: this.mediaService.getUrl(welcomeNft.image),
		};
	}

	async consumeWelcomeNft({
		request,
		welcomeNftId,
	}: {
		request: Request;
		welcomeNftId: number;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const welcomeNft = await this.prisma.welcomeNft.findFirst({
			where: {
				id: welcomeNftId,
				used: false,
			},
			select: {
				id: true,
				siteLink: true,
			},
		});

		if (!welcomeNft) {
			// This might be used by the time user made this api call, let's try to find something else
			const newWelcomeNft = await this.prisma.welcomeNft.findFirst({
				select: {
					id: true,
					siteLink: true,
				},
				where: {
					used: false,
				},
				orderBy: {
					createdAt: 'asc',
				},
			});
			if (!newWelcomeNft) {
				// all are consumed
				throw new BadRequestException(ErrorCodes.MISSING_WELCOME_NFT);
			}

			await this.prisma.welcomeNft.update({
				where: {
					id: newWelcomeNft.id,
				},
				data: {
					used: true,
					userId: authContext.userId,
				},
			});

			return newWelcomeNft.siteLink;
		}

		await this.prisma.welcomeNft.update({
			where: {
				id: welcomeNft.id,
			},
			data: {
				used: true,
				userId: authContext.userId,
			},
		});

		return welcomeNft.siteLink;
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

		const [selectedNfts, selectedNftCount] = await Promise.all([
			this.prisma.userSelectedNft.findMany({
				where: {
					userId: authContext.userId,
				},
				select: {
					walletAddress: true,
					tokenAddress: true,
					tokenId: true,
					chain: true,
				},
			}),
			this.prisma.userSelectedNft.count({
				where: {
					userId: authContext.userId,
				},
			}),
		]);

		const walletNftCollections: EvmNftCollectionDataWithWallet[] = [];
		let next: {
			cursorType?: SupportedChains;
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
				chainSymbol:
					SupportedChainReverseMapping[nftCollection.chain.hex],
				tokens: nftCollection.tokens.map((token) => ({
					tokenId: token.tokenId,
					name: token.name,
					updatedAt: token.media?.updatedAt,
					imageUrl: token.media?.mediaCollection?.medium.url,
					selected: selectedNfts.some(
						(selectedNft) =>
							selectedNft.tokenId === token.tokenId &&
							selectedNft.chain === nftCollection.chain.hex &&
							selectedNft.tokenAddress ===
								nftCollection.tokenAddress.toJSON() &&
							selectedNft.walletAddress ===
								nftCollection.walletAddress,
					),
				})),
			}),
		);

		await Promise.all([
			this.syncWalletNftCollections(walletNftCollections),
			this.syncWalletNftTokens(responseCollections),
		]);

		return {
			collections: responseCollections,
			selectedNftCount,
			next,
		};
	}

	async getSelectedNftCollections({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const selectedNfts = await this.prisma.userSelectedNft.findMany({
			where: {
				userId: authContext.userId,
			},
			select: {
				id: true,
				order: true,
				nftCollection: {
					select: {
						name: true,
						symbol: true,
						collectionLogo: true,
						chain: true,
					},
				},
				nft: {
					select: {
						id: true,
						name: true,
						imageUrl: true,
					},
				},
			},
			orderBy: {
				order: 'asc',
			},
		});

		return selectedNfts.map((selectedNft) => ({
			...selectedNft,
			nftCollection: undefined,
			nft: undefined,
			...selectedNft.nftCollection,
			nftName: selectedNft.nft.name,
			nftImageUrl: selectedNft.nft.imageUrl,
			nftId: selectedNft.nft.id,
		}));
	}

	async getSelectedNfts({ request }: { request: Request }) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		const selectedNfts = await this.prisma.userSelectedNft.findMany({
			where: {
				userId: authContext.userId,
			},
			select: {
				nft: {
					select: {
						id: true,
						name: true,
						imageUrl: true,
					},
				},
			},
			orderBy: {
				nft: {
					tokenUpdatedAt: 'asc',
				},
			},
		});

		return selectedNfts.map((selectedNft) => ({
			nftImageUrl: selectedNft.nft.imageUrl,
			nftId: selectedNft.nft.id,
		}));
	}

	async toggleNftSelected({
		request,
		selectNftDTO: {
			walletAddress,
			tokenAddress,
			tokenId,
			chain,
			selected,
			order,
		},
	}: {
		request: Request;
		selectNftDTO: SelectNftDTO;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;

		await this.prisma.userSelectedNft.deleteMany({
			where: {
				userId: authContext.userId,
				walletAddress,
				tokenAddress,
				chain,
			},
		});

		if (selected) {
			await this.prisma.userSelectedNft.create({
				data: {
					userId: authContext.userId,
					walletAddress,
					tokenAddress,
					tokenId,
					chain,
					order,
				},
			});
		}

		await this.checkUserPfpCriteria(authContext.userId);

		const selectedNftCount = await this.prisma.userSelectedNft.count({
			where: {
				userId: authContext.userId,
			},
		});

		return {
			selectedNftCount,
		};
	}

	private async syncWalletNftCollections(
		walletNftCollections: EvmNftCollectionDataWithWallet[],
	) {
		const alreadyCreatedCollections =
			await this.prisma.nftCollection.findMany({
				where: {
					tokenAddress: {
						in: walletNftCollections.map((walletNftCollection) =>
							walletNftCollection.tokenAddress.toJSON(),
						),
					},
				},
				select: {
					tokenAddress: true,
				},
			});

		const excludedAddresses = new Set(
			alreadyCreatedCollections.map(
				(collection) => collection.tokenAddress,
			),
		);

		const finalCollections = walletNftCollections.filter(
			(walletNftCollection) =>
				!excludedAddresses.has(
					walletNftCollection.tokenAddress.toJSON(),
				),
		) as (EvmNftCollectionDataWithWallet & { collectionLogo: string })[];

		await this.prisma.nftCollection.createMany({
			data: finalCollections.map(
				({
					name,
					symbol,
					tokenAddress,
					contractType,
					collectionLogo,
					chain,
				}) => ({
					name: name || '',
					symbol: symbol || name || '',
					tokenAddress: tokenAddress.toJSON(),
					contractType: contractType || '',
					collectionLogo,
					chain: SupportedChainReverseMapping[chain.hex],
				}),
			),
		});
	}

	private async syncWalletNftTokens(
		nftCollections: {
			tokenAddress: EvmAddress;
			tokens: {
				tokenId: string | number;
				imageUrl?: string;
				name?: string;
				selected: any;
				updatedAt?: Date;
			}[];
		}[],
	) {
		const tokens: Pick<
			Nft,
			| 'name'
			| 'tokenId'
			| 'imageUrl'
			| 'tokenAddress'
			| 'id'
			| 'tokenUpdatedAt'
		>[] = [];

		for (const collection of nftCollections) {
			for (const token of collection.tokens) {
				tokens.push({
					name: token.name || '',
					tokenId: token.tokenId.toString(),
					imageUrl: token.imageUrl || '',
					tokenAddress: collection.tokenAddress.toJSON(),
					tokenUpdatedAt: token.updatedAt ?? null,
					id: `${collection.tokenAddress.toJSON()}_${token.tokenId}`,
				});
			}
		}
		const alreadyCreatedTokens = await this.prisma.nft.findMany({
			where: {
				id: {
					in: tokens.map((token) => token.id),
				},
			},
			select: {
				id: true,
			},
		});

		const excludedIds = new Set(
			alreadyCreatedTokens.map((token) => token.id),
		);
		const finalTokens = tokens.filter(
			(token) => !excludedIds.has(token.id),
		);

		await this.prisma.nft.createMany({
			data: finalTokens.map(
				({
					name,
					tokenId,
					imageUrl,
					tokenAddress,
					id,
					tokenUpdatedAt,
				}) => ({
					name,
					tokenId,
					tokenAddress,
					imageUrl,
					tokenUpdatedAt,
					id,
				}),
			),
		});
	}

	async updateSelectedNftCollectionOrder({
		request,
		selectedNftOrderDTO: { order },
	}: {
		request: Request;
		selectedNftOrderDTO: SelectedNftOrderDTO;
	}) {
		const authContext = Reflect.get(request, 'authContext') as AuthContext;
		const orderMapping = Object.entries(order);

		await Promise.all(
			orderMapping.map(([index, id]) =>
				this.prisma.userSelectedNft.update({
					where: {
						id,
						userId: authContext.userId,
					},
					data: {
						order: Number(index),
					},
				}),
			),
		);

		return this.getSelectedNftCollections({ request });
	}

	private async checkUserPfpCriteria(userId: string) {
		const user = await this.prisma.user.findFirst({
			where: {
				id: userId,
			},
			select: {
				pfpNftId: true,
			},
		});
		if (user?.pfpNftId) {
			return;
		}

		const userSelectedNft = await this.prisma.userSelectedNft.findFirst({
			where: {
				userId,
			},
			select: {
				nft: {
					select: {
						id: true,
					},
				},
			},
			orderBy: {
				nft: {
					tokenUpdatedAt: 'asc',
				},
			},
		});

		if (!userSelectedNft) {
			return;
		}

		await this.prisma.user.update({
			where: {
				id: userId,
			},
			data: {
				pfpNftId: userSelectedNft.nft.id,
			},
		});
	}
}
