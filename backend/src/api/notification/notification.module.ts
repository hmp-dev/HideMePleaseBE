import { Module } from '@nestjs/common';

import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
	providers: [NotificationService],
	exports: [NotificationService],
	controllers: [NotificationController],
})
export class NotificationModule {}
