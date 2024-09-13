import { Module } from '@nestjs/common';

import { CovalentModule } from '@/modules/covalent/covalent.module';
import { SimpleHashModule } from '@/modules/simple-hash/simple-hash.module';
import { NftHardcoderService } from '@/modules/unified-nft/nft-hardcoder.service';
import { UnmarshalModule } from '@/modules/unmarshal/unmarshal.module';

import { UnifiedNftService } from './unified-nft.service';

@Module({
	imports: [CovalentModule, UnmarshalModule, SimpleHashModule],
	providers: [UnifiedNftService, NftHardcoderService],
	exports: [UnifiedNftService],
})
export class UnifiedNftModule {}
