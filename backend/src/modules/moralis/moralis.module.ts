import { Module } from '@nestjs/common';

import { ComputeUnitService } from '@/modules/moralis/compute-unit.service';
import { MoralisApiService } from '@/modules/moralis/moralis-api.service';

@Module({
	imports: [],
	providers: [MoralisApiService, ComputeUnitService, MoralisApiService],
	exports: [MoralisApiService],
})
export class MoralisModule {}
