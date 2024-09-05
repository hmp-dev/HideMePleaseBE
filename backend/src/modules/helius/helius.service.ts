import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Helius } from 'helius-sdk';
import StringSimilarity from 'string-similarity';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { stripNftName } from '@/modules/web3/web3.utils';
import { EnvironmentVariables } from '@/utils/env';

@Injectable()
export class HeliusService implements OnModuleInit {
	private client!: Helius;

	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
		private prisma: PrismaService,
	) {}

	onModuleInit(): any {
		this.client = new Helius(this.configService.get('HELIUS_API_KEY'));
	}

	async getGroupIdForNft(tokenAddress: string) {
		console.log('HELIUS TRIGGERED');
		const cachedValue = await this.prisma.solanaGroups.findFirst({
			where: {
				tokenAddress,
			},
		});

		if (cachedValue) {
			return cachedValue.groupId;
		}

		const response = await this.client.rpc.getAsset({
			id: tokenAddress,
		});

		const grouping = response.grouping?.find(
			(group) => group.group_key === 'collection',
		);
		console.log('got solana grouping', grouping);

		if (grouping) {
			await this.prisma.solanaGroups.createMany({
				data: {
					tokenAddress,
					groupId: grouping.group_value,
				},
				skipDuplicates: true,
			});
			return grouping.group_value;
		} else if (
			response?.creators?.length &&
			response.content?.metadata?.name
		) {
			const customId = `group_${stripNftName(response.content.metadata.name)}`;
			const creatorAddress = response.creators[0].address;

			const allNftsByCreator = await this.client.rpc.getAssetsByCreator({
				creatorAddress,
				page: 1,
			});

			const insertionGroups: {
				tokenAddress: string;
				groupId: string;
			}[] = [];

			for (const nft of allNftsByCreator.items) {
				if (!nft.content) {
					continue;
				}

				const similarity = StringSimilarity.compareTwoStrings(
					nft.content.metadata.name,
					response.content.metadata.name,
				);

				if (similarity > 0.7) {
					insertionGroups.push({
						tokenAddress: nft.id,
						groupId: customId,
					});
				}
			}

			if (insertionGroups.length) {
				console.log('inserting groups');

				await this.prisma.solanaGroups.createMany({
					data: insertionGroups,
					skipDuplicates: true,
				});
			}

			return customId;
		} else if (response.content?.metadata?.name) {
			return stripNftName(response.content.metadata.name);
		}

		return tokenAddress;
	}
}
