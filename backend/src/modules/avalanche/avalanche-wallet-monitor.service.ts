import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Sentry from '@sentry/nestjs';
import { ethers } from 'ethers';

import { AvalancheNftService } from './avalanche-nft.service';

/**
 * 0.1 AVAX. Below this we send a Sentry warning so an operator can top up
 * before any mints fail. mintPfpToken's own pre-flight check requires 0.01.
 */
const WARNING_THRESHOLD_WEI = ethers.parseEther('0.1');

/**
 * 0.05 AVAX. Below this we send a Sentry error: minting will start failing
 * very soon and on-call should treat this as urgent.
 */
const CRITICAL_THRESHOLD_WEI = ethers.parseEther('0.05');

/**
 * Polls the company minting wallet's AVAX balance and reports low-balance
 * conditions to Sentry. We did *not* hook this directly into SNS because:
 *
 *  - Sentry already has email routing to the on-call inbox.
 *  - Going through Sentry gives us deduplication, fingerprinting, and history
 *    for free, which a raw SNS publish wouldn't.
 *
 * If/when we want hard escalation to SNS we can add it here later — the
 * IAM role on this instance already has sns:Publish.
 */
@Injectable()
export class AvalancheWalletMonitorService implements OnModuleInit {
	private readonly logger = new Logger(AvalancheWalletMonitorService.name);

	constructor(private readonly avalancheNftService: AvalancheNftService) {}

	async onModuleInit() {
		// Run once at startup so we don't have to wait up to 5 minutes after a
		// deploy to learn the wallet is empty.
		void this.checkBalance();
	}

	@Cron(CronExpression.EVERY_5_MINUTES, {
		name: 'avalancheWalletBalanceCheck',
	})
	async checkBalance(): Promise<void> {
		try {
			const { address, balanceWei, balanceAvax } =
				await this.avalancheNftService.getMintingWalletBalance();

			if (balanceWei < CRITICAL_THRESHOLD_WEI) {
				const message = `Minting wallet balance critically low: ${balanceAvax} AVAX (< 0.05). Minting will start failing soon.`;
				this.logger.error(`${message} address=${address}`);
				Sentry.captureMessage(message, {
					level: 'error',
					tags: {
						component: 'wallet-monitor',
						severity: 'critical',
					},
					extra: { address, balanceAvax, threshold: '0.05' },
				});
				return;
			}

			if (balanceWei < WARNING_THRESHOLD_WEI) {
				const message = `Minting wallet balance low: ${balanceAvax} AVAX (< 0.1). Top up soon.`;
				this.logger.warn(`${message} address=${address}`);
				Sentry.captureMessage(message, {
					level: 'warning',
					tags: {
						component: 'wallet-monitor',
						severity: 'warning',
					},
					extra: { address, balanceAvax, threshold: '0.1' },
				});
				return;
			}

			this.logger.log(
				`Minting wallet balance OK: ${balanceAvax} AVAX (address=${address})`,
			);
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e));
			this.logger.error(`Wallet balance check failed: ${err.message}`);
			Sentry.captureException(err, {
				tags: {
					component: 'wallet-monitor',
					kind: 'check-failed',
				},
			});
		}
	}
}
