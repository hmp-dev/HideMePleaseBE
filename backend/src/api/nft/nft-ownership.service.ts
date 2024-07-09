import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Nft, NftCollection } from '@prisma/client';
import { PromisePool } from '@supercharge/promise-pool';

import {
	OWNERSHIP_CHECK_CONCURRENCY,
	PAGINATION_DEPTH_FOR_NFTS,
} from '@/api/nft/nft.constants';
import { NftCreateWithCollection } from '@/api/nft/nft.types';
import { KlaytnNftService } from '@/modules/klaytn/klaytn-nft.service';
import { NftCollectionWithTokens } from '@/modules/moralis/moralis.constants';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { UnifiedNftService } from '@/modules/unified-nft/unified-nft.service';

@Injectable()
export class NftOwnershipService {
	private logger = new Logger(NftOwnershipService.name);

	constructor(
		private prisma: PrismaService,
		private unifiedNftService: UnifiedNftService,
		private klaytnNftService: KlaytnNftService,
	) {}

	async syncWalletNftCollections(
		walletNftCollections: NftCollectionWithTokens[],
	) {
		const alreadyCreatedCollections =
			await this.prisma.nftCollection.findMany({
				where: {
					tokenAddress: {
						in: walletNftCollections.map(
							(walletNftCollection) =>
								walletNftCollection.tokenAddress,
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
				!excludedAddresses.has(walletNftCollection.tokenAddress),
		) as (NftCollectionWithTokens & { collectionLogo: string })[];

		await this.prisma.nftCollection.createMany({
			data: finalCollections.map(
				({
					name,
					symbol,
					tokenAddress,
					contractType,
					collectionLogo,
					chainSymbol,
				}) => ({
					name: name || '',
					symbol: symbol || name || '',
					tokenAddress: tokenAddress,
					contractType: contractType || '',
					collectionLogo,
					chain: chainSymbol,
				}),
			),
		});
	}

	async syncWalletNftTokens(nftCollections: NftCollectionWithTokens[]) {
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
					tokenId: token.tokenId?.toString() || '',
					imageUrl: token.imageUrl || '',
					tokenAddress: collection.tokenAddress,
					tokenUpdatedAt: null,
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
			skipDuplicates: true,
		});
	}

	private async upsertWalletNfts({
		walletAddress,
		nfts,
	}: {
		walletAddress: string;
		nfts: NftCreateWithCollection[];
	}) {
		const existingCollections = await this.prisma.nftCollection.findMany({
			where: {
				tokenAddress: {
					in: [...new Set(nfts.map((nft) => nft.tokenAddress))],
				},
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
				contractType: nft.contractType || '',
				chain: nft.chain,
				name: nft.name,
				symbol: nft.symbol || '',
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
			},
			select: {
				id: true,
			},
		});

		const existingNftIds = new Set(existingNfts.map(({ id }) => id));
		const nftsToCreate = nfts.filter((nft) => !existingNftIds.has(nft.id));

		await this.prisma.nft.deleteMany({
			where: {
				id: {
					in: nftsToCreate.map((nft) => nft.id),
				},
			},
		});

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
					ownerWalletAddress: undefined,
					chain: undefined,
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
		let res = await this.unifiedNftService.getNftsForAddress({
			walletAddress,
			selectedNftIds: new Set(),
		});

		const nftData: NftCreateWithCollection[] = [];

		res.nftCollections.forEach((nftCollection) => {
			nftCollection.tokens.forEach((token) => {
				nftData.push({
					...token,
					imageUrl: token.imageUrl || '',
					name: token.name || '',
					tokenId: token.tokenId?.toString() || '',
					tokenAddress: nftCollection.tokenAddress,
					ownedWalletAddress: nftCollection.walletAddress,
					chain: nftCollection.chainSymbol,
				});
			});
		});

		let currentDepth = 0;
		while (res.next && currentDepth < PAGINATION_DEPTH_FOR_NFTS) {
			currentDepth++;
			res = await this.unifiedNftService.getNftsForAddress({
				walletAddress,
				selectedNftIds: new Set(),
				nextPage: res.next?.nextPage,
				nextChain: res.next?.nextChain,
			});

			res.nftCollections.forEach((nftCollection) => {
				nftCollection.tokens.forEach((token) => {
					nftData.push({
						...token,
						imageUrl: token.imageUrl || '',
						name: token.name || '',
						tokenId: token.tokenId?.toString() || '',
						tokenAddress: nftCollection.tokenAddress,
						ownedWalletAddress: nftCollection.walletAddress,
						chain: nftCollection.chainSymbol,
					});
				});
			});
		}

		// now we have all the nfts for this wallet
		await this.upsertWalletNfts({
			nfts: nftData,
			walletAddress,
		});
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

	@Cron(CronExpression.EVERY_MINUTE)
	async syncSubmittedNftContracts() {
		const systemNfts = await this.prisma.systemNftCollection.findMany({
			where: {
				addressUpdated: false,
				contractSubmitted: true,
			},
		});

		if (!systemNfts.length) {
			return;
		}
		this.logger.log(`syncSubmittedNftContracts start`);
		const contracts = await this.klaytnNftService.getContractList();

		const aliasAddressMap: Record<string, string> = {};

		contracts.items.forEach(
			(item) => (aliasAddressMap[item.alias] = item.address),
		);

		for (const collection of systemNfts) {
			if (aliasAddressMap[collection.alias]) {
				await this.prisma.systemNftCollection.updateMany({
					where: {
						alias: collection.alias,
					},
					data: {
						tokenAddress: aliasAddressMap[collection.alias],
						addressUpdated: true,
					},
				});
			}
		}
	}

	@Cron(CronExpression.EVERY_MINUTE)
	async deployPendingNftContract() {
		const systemNfts = await this.prisma.systemNftCollection.findMany({
			where: {
				contractSubmitted: false,
			},
		});

		for (const collection of systemNfts) {
			this.logger.log(`Deploying ${collection.alias} contract`);

			const response = await this.klaytnNftService.deployContract({
				name: collection.name,
				alias: collection.alias,
				symbol: collection.symbol,
			});
			this.logger.log(`Deploy response: ${JSON.stringify(response)}`);
			await this.prisma.systemNftCollection.update({
				where: {
					alias: collection.alias,
				},
				data: {
					contractSubmitted: true,
				},
			});
		}
	}
}
