import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Helius } from 'helius-sdk';

import { PrismaService } from '@/modules/prisma/prisma.service';
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

		if (grouping) {
			return grouping.group_value;
		}

		return tokenAddress;
	}
}
