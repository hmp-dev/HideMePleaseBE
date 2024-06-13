import { Module } from '@nestjs/common';

import { UnmarshalService } from './unmarshal.service';

@Module({
	providers: [UnmarshalService],
	exports: [UnmarshalService],
})
export class UnmarshalModule {}
