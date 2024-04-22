import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { createSoftDeleteMiddleware } from 'prisma-soft-delete-middleware';

import { isDevelopment } from '@/utils/predicates';

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor() {
		const log: Prisma.LogLevel[] = ['error'];

		/* c8 ignore next */
		if (isDevelopment()) {
			// log.push(...(['query', 'info', 'warn'] as Prisma.LogLevel[]));
		}

		super({ log });
	}

	/* c8 ignore next */

	// noinspection JSUnusedGlobalSymbols
	async onModuleInit() {
		await this.$connect();
		this.initSoftDeleteMiddleware();
	}

	initSoftDeleteMiddleware() {
		this.$use(
			createSoftDeleteMiddleware({
				// Add all models which need to support soft delete here
				models: {
					Wallet: true,
				},
			}),
		);
	}

	/* c8 ignore next */

	// noinspection JSUnusedGlobalSymbols
	async onModuleDestroy() {
		await this.$disconnect();
	}
}
