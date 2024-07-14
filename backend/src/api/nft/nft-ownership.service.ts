import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PromisePool } from '@supercharge/promise-pool';
import { type Cache } from 'cache-manager';

import { NftCreateDTO } from '@/api/nft/nft.types';
import { getNftKey } from '@/api/nft/nft.utils';
import { CACHE_TTL } from '@/constants';
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
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

	async saveNftCollectionsToDatabase(
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

	async saveNftsToCache(nftCollections: NftCollectionWithTokens[]) {
		const tokens: NftCreateDTO[] = [];

		for (const collection of nftCollections) {
			for (const token of collection.tokens) {
				tokens.push({
					name: token.name || '',
					tokenId: token.tokenId?.toString() || '',
					imageUrl: token.imageUrl || '',
					tokenAddress: collection.tokenAddress,
					id: token.id,
					ownedWalletAddress: token.ownerWalletAddress,
				});
			}
		}

		await PromisePool.withConcurrency(20)
			.for(tokens)
			.process(async (token) => {
				await this.cacheManager.set(
					getNftKey(token.id),
					token,
					CACHE_TTL.FIVE_MIN_IN_MILLISECONDS,
				);
			});
	}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async syncAllNftOwnership() {
		this.logger.log(`Starting ownership check for all nfts`);

		const allNfts = await this.prisma.nft.findMany({
			select: {
				tokenAddress: true,
				id: true,
				tokenId: true,
				ownedWalletAddress: true,
				nftCollection: {
					select: {
						chain: true,
					},
				},
			},
		});

		const { errors } = await PromisePool.for(allNfts)
			.withConcurrency(5)
			.process(async (nft) => {
				const isOwner = await this.unifiedNftService.checkNftOwner({
					tokenAddress: nft.tokenAddress,
					tokenId: nft.tokenId,
					chain: nft.nftCollection.chain,
					walletAddress: nft.ownedWalletAddress,
				});
				if (!isOwner) {
					this.logger.log(
						`Ownership of ${nft.tokenAddress} ${nft.tokenId} no longer belongs to ${nft.ownedWalletAddress}. Deleting record`,
					);
					await this.prisma.nft.delete({
						where: {
							id: nft.id,
						},
					});
				} else {
					this.logger.log(
						`Ownership of ${nft.tokenAddress} ${nft.tokenId} verified to ${nft.ownedWalletAddress}`,
					);
				}
			});
		this.logger.log(
			`Nft ownership check completed with ${errors.length} errors`,
		);
		if (errors.length) {
			this.logger.log(`Errors: ${JSON.stringify(errors)}`);
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
