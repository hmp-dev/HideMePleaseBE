import { Module } from '@nestjs/common';

import { SendbirdService } from './sendbird.service';

@Module({
	providers: [SendbirdService],
})
export class SendbirdModule {}
