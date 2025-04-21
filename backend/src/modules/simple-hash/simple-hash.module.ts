import { Module } from '@nestjs/common';

import { HeliusModule } from '@/modules/helius/helius.module';

import { SimpleHashService } from './simple-hash.service';

@Module({
	imports: [HeliusModule],
	providers: [SimpleHashService],
	exports: [SimpleHashService],
})
export class SimpleHashModule {}
