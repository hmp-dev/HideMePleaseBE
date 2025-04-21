import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { EnvironmentVariables } from '@/utils/env';
import { ErrorCodes } from '@/utils/errorCodes';

@Injectable()
export class WorldcoinService {
	client = axios.create({
		baseURL: 'https://developer.worldcoin.org',
	});

	constructor(
		private configService: ConfigService<EnvironmentVariables, true>,
	) {
		// setTimeout(() => {
		// 	this.verifyCredentials({
		// 		proof: '0x16a43770e31226ca20beea85b5f75ae49b81c96d6e022132f4b6e8dab5ae421d112cf4e73f05c1dede5f51ab2129ae269692a93a15dfcdd982b9a706157990e32179501867ea20c25d98dc56ca287031fc6329b4ea7fb619552d208afd79206d066982571d304e3ae6b801b137c778df8dc4d8c337080f7803ed5102f469ef4f17afa87324eea922c9fb5cf20e1eeffd5098023994bc7b1b73f544ca6be725b8165dad6a4dde4d5a3260490d7c21aa278126759ef3e3b6fd60a8483e71cef9442d460bf497f530526b03f092c18b779091793e88dad2d1b6c5a7206b65d9e7802a2a817644bccc07f0867771d49ef11863cea9b8ea2cacadf534a4eb7fbbd65f',
		// 		merkleRoot:
		// 			'0x1a9e6eae575803ec16be3173bd1f50bf3847ce7a1f70bb59669430fb4bffcbe3',
		// 		nullifierHash:
		// 			'0x25524f94623d2457995c5995824c28814990e42cee55a4b26a5e5cbeb39119dd',
		// 		verificationLevel: 'orb',
		// 		action: 'action-first',
		// 	}).then(console.log);
		// }, 1000);
	}

	async verifyCredentials(credentials: {
		nullifierHash: string;
		merkleRoot: string;
		proof: string;
		verificationLevel: string;
		action: string;
	}) {
		const requestBody = {
			merkle_root: credentials.merkleRoot,
			nullifier_hash: credentials.nullifierHash,
			proof: credentials.proof,
			verification_level: credentials.verificationLevel,
			action: credentials.action,
			signal: '',
		};
		const res = await this.client.post<{
			success: boolean;
			nullifier_hash: string;
		}>(
			`/api/v1/verify/${this.configService.get('WLD_APP_ID')}`,
			requestBody,
		);
		if (res.data.success) {
			return res.data.nullifier_hash;
		}

		throw new BadRequestException(ErrorCodes.COULD_NOT_VERIFY);
	}
}
