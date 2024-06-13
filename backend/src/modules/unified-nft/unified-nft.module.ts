import { Module } from '@nestjs/common';

import { CovalentModule } from '@/modules/covalent/covalent.module';
import { UnmarshalModule } from '@/modules/unmarshal/unmarshal.module';

import { UnifiedNftService } from './unified-nft.service';

@Module({
	imports: [CovalentModule, UnmarshalModule],
	providers: [UnifiedNftService],
	exports: [UnifiedNftService],
})
export class UnifiedNftModule {}
