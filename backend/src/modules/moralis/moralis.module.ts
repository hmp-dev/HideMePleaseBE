import { Module } from '@nestjs/common';

import { ComputeUnitService } from '@/modules/moralis/compute-unit.service';
import { MoralisApiService } from '@/modules/moralis/moralis-api.service';
import { MoralisNftService } from '@/modules/moralis/moralis-nft.service';

@Module({
	imports: [],
	providers: [
		MoralisNftService,
		MoralisApiService,
		ComputeUnitService,
		MoralisApiService,
	],
	exports: [MoralisNftService, MoralisApiService],
})
export class MoralisModule {}
