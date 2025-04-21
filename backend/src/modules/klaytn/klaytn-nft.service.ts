import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CaverExtKAS from 'caver-js-ext-kas';

import { EnvironmentVariables } from '@/utils/env';

@Injectable()
export class KlaytnNftService {
	caver: CaverExtKAS;
	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
	) {
		this.caver = new CaverExtKAS(
			this.configService.get('KLAYTN_CHAIN_ID'),
			this.configService.get('KLAYTN_ACCESS_KEY'),
			this.configService.get('KLAYTN_ACCESS_KEY_SECRET'),
		);
	}

	async deployContract({
		name,
		symbol,
		alias,
	}: {
		name: string;
		symbol: string;
		alias: string;
	}) {
		return this.caver.kas.kip17.deploy(name, symbol, alias);
	}

	mintToken({
		aliasOrAddress,
		destinationWalletAddress,
		tokenUri,
		tokenId,
	}: {
		aliasOrAddress: string;
		destinationWalletAddress: string;
		tokenId: string;
		tokenUri: string;
	}) {
		return this.caver.kas.kip17.mint(
			aliasOrAddress,
			destinationWalletAddress,
			tokenId,
			tokenUri,
		);
	}

	async getContractList() {
		return this.caver.kas.kip17.getContractList();
	}
}
