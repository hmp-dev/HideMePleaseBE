import { EvmAddress } from '@moralisweb3/common-evm-utils';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Nft, NftCollection, SupportedChains } from '@prisma/client';
import { PromisePool } from '@supercharge/promise-pool';

import {
	CHAIN_CHECK_CONCURRENCY,
	OWNERSHIP_CHECK_CONCURRENCY,
	PAGINATION_DEPTH_FOR_NFTS,
} from '@/api/nft/nft.constants';
import { NftCreateWithCollection } from '@/api/nft/nft.types';
import { evmNftToNft } from '@/api/nft/nft.utils';
import { EvmNftCollectionDataWithWallet } from '@/modules/moralis/moralis.constants';
import { MoralisApiService } from '@/modules/moralis/moralis-api.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
	SupportedChainMapping,
	SupportedChainReverseMapping,
	SupportedChainsList,
} from '@/modules/web3/web3.constants';

@Injectable()
export class NftOwnershipService {
	private logger = new Logger(NftOwnershipService.name);

	constructor(
		private prisma: PrismaService,
		private moralisApiService: MoralisApiService,
	) {}

	async syncWalletNftCollections(
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

	async syncWalletNftTokens(
		nftCollections: {
			tokenAddress: EvmAddress;
			tokens: {
				tokenId: string | number;
				imageUrl?: string;
				name?: string;
				selected: any;
				updatedAt?: Date;
				ownerWalletAddress: string;
				id: string;
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
			| 'ownedWalletAddress'
		>[] = [];

		for (const collection of nftCollections) {
			for (const token of collection.tokens) {
				tokens.push({
					name: token.name || '',
					tokenId: token.tokenId.toString(),
					imageUrl: token.imageUrl || '',
					tokenAddress: collection.tokenAddress.toJSON(),
					tokenUpdatedAt: token.updatedAt ?? null,
					id: token.id,
					ownedWalletAddress: token.ownerWalletAddress,
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
					ownedWalletAddress,
				}) => ({
					name,
					tokenId,
					tokenAddress,
					imageUrl,
					tokenUpdatedAt,
					id,
					ownedWalletAddress,
					lastOwnershipCheck: new Date(),
				}),
			),
		});
	}

	private async upsertWalletNfts({
		walletAddress,
		nfts,
		chain,
	}: {
		walletAddress: string;
		nfts: NftCreateWithCollection[];
		chain: SupportedChains;
	}) {
		const existingCollections = await this.prisma.nftCollection.findMany({
			where: {
				tokenAddress: {
					in: [...new Set(nfts.map((nft) => nft.tokenAddress))],
				},
				chain,
			},
			select: {
				tokenAddress: true,
			},
		});
		const existingCollectionAddresses = new Set(
			existingCollections.map((collection) => collection.tokenAddress),
		);

		const collectionsToCreate: Pick<
			NftCollection,
			| 'tokenAddress'
			| 'contractType'
			| 'chain'
			| 'name'
			| 'symbol'
			| 'collectionLogo'
		>[] = [];

		nfts.forEach((nft) => {
			if (existingCollectionAddresses.has(nft.tokenAddress)) {
				return;
			}

			collectionsToCreate.push({
				tokenAddress: nft.tokenAddress,
				contractType: nft.contractType,
				chain,
				name: nft.name,
				symbol: nft.symbol,
				collectionLogo: nft.imageUrl,
			});
			// so this does not get added again
			existingCollectionAddresses.add(nft.tokenAddress);
		});

		await this.prisma.nftCollection.createMany({
			data: collectionsToCreate,
		});

		const existingNfts = await this.prisma.nft.findMany({
			where: {
				ownedWalletAddress: walletAddress,
				nftCollection: {
					chain,
				},
			},
			select: {
				id: true,
			},
		});

		const existingNftIds = new Set(existingNfts.map(({ id }) => id));
		const nftsToCreate = nfts.filter((nft) => !existingNftIds.has(nft.id));

		await Promise.all([
			this.prisma.nft.updateMany({
				where: {
					id: {
						in: existingNfts.map(({ id }) => id),
					},
				},
				data: {
					lastOwnershipCheck: new Date(),
				},
			}),
			this.prisma.nft.createMany({
				data: nftsToCreate.map((nft) => ({
					...nft,
					symbol: undefined,
					contractType: undefined,
				})),
			}),
		]);

		const newNftIds = new Set(nfts.map(({ id }) => id));
		const nftsToDelete = existingNfts
			.filter((nft) => !newNftIds.has(nft.id))
			.map(({ id }) => id);

		if (nftsToDelete.length) {
			this.logger.log(`Unlinking nfts from user ${nftsToDelete}`);

			await this.prisma.nft.deleteMany({
				where: {
					id: {
						in: nftsToDelete,
					},
				},
			});
		}
	}

	private async checkWalletNftOwnership(walletAddress: string) {
		this.logger.log(
			`Starting ownership check for wallet with ${walletAddress}`,
		);

		const { errors } = await PromisePool.withConcurrency(
			CHAIN_CHECK_CONCURRENCY,
		)
			.for(SupportedChainsList)
			.process(async (supportedChain) => {
				let res = await this.moralisApiService.getWalletNFTs({
					address: walletAddress,
					chain: SupportedChainMapping[supportedChain].hex,
					mediaItems: true,
					normalizeMetadata: true,
				});

				const nftData: NftCreateWithCollection[] = [];

				res.result.forEach((token) => {
					nftData.push(evmNftToNft(token));
				});

				let currentDepth = 0;
				while (
					res.hasNext() &&
					currentDepth < PAGINATION_DEPTH_FOR_NFTS
				) {
					currentDepth++;
					res = await res.next();

					res.result.forEach((token) => {
						nftData.push(evmNftToNft(token));
					});
				}

				// now we have all the nfts for this wallet
				await this.upsertWalletNfts({
					nfts: nftData,
					walletAddress,
					chain: supportedChain,
				});
			});

		this.logger.log(
			`Finished ownership check for wallet ${walletAddress} with ${errors.length} errors`,
		);
		if (errors) {
			this.logger.log(
				`Wallet ownership errors: ${JSON.stringify(errors)}`,
			);
		}
	}

	async checkUserNftOwnership(userId: string) {
		this.logger.log(`Starting ownership check for user with ${userId}`);
		const userWallets = await this.prisma.wallet.findMany({
			where: {
				userId,
			},
			select: {
				publicAddress: true,
			},
		});
		if (!userWallets.length) {
			return;
		}

		this.logger.log(
			`Starting ownership check for user with ${userId} with ${userWallets.length} wallets`,
		);
		const addresses = userWallets.map(({ publicAddress }) => publicAddress);

		const { errors } = await PromisePool.withConcurrency(
			OWNERSHIP_CHECK_CONCURRENCY,
		)
			.for(addresses)
			.process((walletAddress) =>
				this.checkWalletNftOwnership(walletAddress),
			);

		this.logger.log(
			`Finished ownership check for user ${userId} with ${errors.length} errors`,
		);
		if (errors) {
			this.logger.log(`User ownership errors: ${JSON.stringify(errors)}`);
		}
	}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async checkOwnershipForAllUsers() {
		this.logger.log(`Starting ownership check for all users`);

		const users = await this.prisma.user.findMany({
			select: {
				id: true,
			},
		});

		for (const user of users) {
			await this.checkUserNftOwnership(user.id);
		}
	}
}
