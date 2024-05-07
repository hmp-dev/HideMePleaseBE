import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { default as Moralis } from 'moralis';

import { EnvironmentVariables } from '@/utils/env';

import { ComputeUnitService } from './compute-unit.service';
import { MoralisEndPoints } from './moralis.constants';

@Injectable()
export class MoralisApiService {
	private readonly logger = new Logger(MoralisApiService.name);

	private endpointWeights: Record<MoralisEndPoints, number> = {
		[MoralisEndPoints.resolveENSDomain]: 1,
		[MoralisEndPoints.getWalletNFTs]: 1,
		[MoralisEndPoints.getWalletNFTCollections]: 1,
		[MoralisEndPoints.getNFTCollectionStats]: 1,
		[MoralisEndPoints.getNFTLowestPrice]: 1,
	};

	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
		private computeUnitService: ComputeUnitService,
	) {}

	async init() {
		await Moralis.start({
			apiKey: this.configService.get('MORALIS_API_KEY'),
		});

		await this.updateEndpointWeights();
	}

	private rateLimitHandler = (endpointName: MoralisEndPoints) => ({
		apply: async (target: unknown, _: any, argumentsList: unknown[]) => {
			const endpointWeight = Number(this.endpointWeights[endpointName]);
			const computeUnit =
				await this.computeUnitService.requestComputeUnits(
					endpointWeight,
				);

			try {
				// @ts-expect-error this is okay
				const result = (await target(...argumentsList)) as unknown;
				void this.computeUnitService.releaseComputeUnits(computeUnit);
				// this.setEndpointCache(endpointName, argumentsList, result);

				return result;
			} catch (e) {
				void this.computeUnitService.releaseComputeUnits(computeUnit);
				this.logger.log('Moralis error');

				// return null;
				throw e;
			}
		},
	});

	private async updateEndpointWeights() {
		const weights = await Moralis.EvmApi.utils.endpointWeights();
		weights.result.forEach(({ endpoint, rateLimitCost }) => {
			if (MoralisEndPoints[endpoint as MoralisEndPoints]) {
				this.endpointWeights[endpoint as MoralisEndPoints] =
					Number(rateLimitCost);
			}
		});

		this.logger.log(
			'Updated moralis endpoint weights' +
				JSON.stringify(this.endpointWeights),
		);
	}

	resolveENSDomain = new Proxy<
		typeof Moralis.EvmApi.resolve.resolveENSDomain
	>(
		Moralis.EvmApi.resolve.resolveENSDomain,
		this.rateLimitHandler(MoralisEndPoints.resolveENSDomain),
	);

	getWalletNFTs = new Proxy<typeof Moralis.EvmApi.nft.getWalletNFTs>(
		Moralis.EvmApi.nft.getWalletNFTs,
		this.rateLimitHandler(MoralisEndPoints.getWalletNFTs),
	);

	getWalletNFTCollections = new Proxy<
		typeof Moralis.EvmApi.nft.getWalletNFTCollections
	>(
		Moralis.EvmApi.nft.getWalletNFTCollections,
		this.rateLimitHandler(MoralisEndPoints.getWalletNFTCollections),
	);

	getNFTLowestPrice = new Proxy<typeof Moralis.EvmApi.nft.getNFTLowestPrice>(
		Moralis.EvmApi.nft.getNFTLowestPrice,
		this.rateLimitHandler(MoralisEndPoints.getWalletNFTCollections),
	);

	getNFTCollectionStats = new Proxy<
		typeof Moralis.EvmApi.nft.getNFTCollectionStats
	>(
		Moralis.EvmApi.nft.getNFTCollectionStats,
		this.rateLimitHandler(MoralisEndPoints.getWalletNFTCollections),
	);
}
