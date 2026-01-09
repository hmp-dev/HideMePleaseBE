import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '@/api/auth/auth.module';
import { NftModule } from '@/api/nft/nft.module';
import { PointModule } from '@/api/points/point.module';
import { PushNotificationModule } from '@/api/push-notification/push-notification.module';
import { SpaceController } from '@/api/space/space.controller';
import { SpacePublicController } from '@/api/space/space-public.controller';
import { SpaceService } from '@/api/space/space.service';
import { SpaceCheckInService } from '@/api/space/space-checkin.service';
import { LiveActivityService } from '@/api/space/live-activity.service';
import { SirenController } from '@/api/space/siren.controller';
import { SirenService } from '@/api/space/siren.service';
import { SpaceLocationModuleModule } from '@/api/space/space-location.module';
import { UsersModule } from '@/api/users/users.module';
import { SystemConfigModule } from '@/modules/system-config/system-config.module';

import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		AuthModule,
		NftModule,
		UsersModule,
		SystemConfigModule,
		SpaceLocationModuleModule,
		NotificationModule,
		PushNotificationModule,
		PointModule,
		ScheduleModule.forRoot(),
	],
	controllers: [SpaceController, SpacePublicController, SirenController],
	providers: [SpaceService, SpaceCheckInService, LiveActivityService, SirenService],
	exports: [SpaceCheckInService, LiveActivityService],
})
export class SpaceModule {}
