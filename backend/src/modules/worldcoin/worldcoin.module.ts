import { Global, Module } from '@nestjs/common';

import { WorldcoinService } from '@/modules/worldcoin/worldcoin.service';

@Global()
@Module({
	providers: [WorldcoinService],
	exports: [WorldcoinService],
})
export class WorldcoinModule {}
