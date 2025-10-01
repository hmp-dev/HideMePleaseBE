import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { NotificationModule } from '@/api/notification/notification.module';
import { FriendsController } from '@/api/friends/friends.controller';
import { FriendsService } from '@/api/friends/friends.service';

@Module({
	imports: [AuthModule, NotificationModule],
	controllers: [FriendsController],
	providers: [FriendsService],
	exports: [FriendsService],
})
export class FriendsModule {}
