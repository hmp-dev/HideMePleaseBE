import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '@/api/auth/auth.module';
import { NftModule } from '@/api/nft/nft.module';
import { PointModule } from '@/api/points/point.module';
import { SpaceController } from '@/api/space/space.controller';
import { SpaceService } from '@/api/space/space.service';
import { SpaceCheckInService } from '@/api/space/space-checkin.service';
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
		PointModule,
		ScheduleModule.forRoot(),
	],
	controllers: [SpaceController, SirenController],
	providers: [SpaceService, SpaceCheckInService, SirenService],
	exports: [SpaceCheckInService],
})
export class SpaceModule {}
