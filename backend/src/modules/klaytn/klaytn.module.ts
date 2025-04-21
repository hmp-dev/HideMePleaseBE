import { Module } from '@nestjs/common';

import { KlaytnNftService } from './klaytn-nft.service';

@Module({
	providers: [KlaytnNftService],
	exports: [KlaytnNftService],
})
export class KlaytnModule {}
