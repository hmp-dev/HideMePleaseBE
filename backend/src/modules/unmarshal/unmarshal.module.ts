import { Module } from '@nestjs/common';

import { HeliusModule } from '@/modules/helius/helius.module';

import { UnmarshalService } from './unmarshal.service';

@Module({
	imports: [HeliusModule],
	providers: [UnmarshalService],
	exports: [UnmarshalService],
})
export class UnmarshalModule {}
